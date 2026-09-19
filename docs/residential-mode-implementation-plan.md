# Livic — Multi-Vertical Architecture & Residential Plan

> **Status**: Draft for discussion · **Last updated**: 2026-09-16
> **Supersedes**: the earlier residential-only plan (ownership as a lease type, then a separate `unit_ownership_tbl`). Both are replaced by the core model in §4.
> **Stage**: development — destructive schema and package changes are acceptable.

---

## 1. Goal

Grow Livic from a rental-only product into one platform that serves:

| Product | What it is | Status |
|---|---|---|
| **Rental** | A landlord rents rooms/flats in their property to tenants | Live today |
| **Residential** | One building, each flat owned by a different person; owners live there or rent it out | Next |
| **Society** | Many towers, hundreds of flats, committee-run, gate/visitors, amenities | Later |
| **Hostel** | Beds instead of flats, meals, attendance | Later |
| **Vendor marketplace** | Local vendors sell to residents across many buildings | Later, separate build |

Principle: **build the shared core once, keep only product-specific logic in verticals.** Residential is not its own module — it is Society with fewer modules switched on.

---

## 2. Target architecture

```
verticals/     only what is unique per product
  rental       leases, bookings, deposits, roommate split, move-in/out inventory
  society      ownership transfer, committee, visitors/gate, amenities, parking, polls, society accounting
  (later)      hostel, vendor marketplace
      │
      ▼
core/          the building and its money, shared by every product
  property     property, block, unit, unit_member
  finance      charge configs, bills, bill lines, ledger, meter readings, worksheets
  community    issues, announcements, documents, analytics
      │
      ▼
platform/      identity, money movement, messaging
  auth, user, security, payment gateway, notification, storage,
  subscription (moved from services/billing), permission registry
```

### Dependency rules (enforced by `ModuleBoundaryTest`)
- `verticals → core → platform`, never upward.
- A vertical never depends on another vertical.
- When core needs something from a vertical, it uses an SPI or an event (the existing `UnitOccupancyProvider` pattern).
- Core must never import lease/rental classes. This is why `unit_member` (§4.3) and payer-based bills (§4.5) live in core.

### Where today's code moves

| Today | Target |
|---|---|
| `platform/*` (auth, user, security, payment, notification, storage, common, config) | stays in `platform` |
| `services/billing` (SaaS plans, feature limits, wallet) | `platform/subscription` |
| `platform/common/constant/StaffPermission` (one central enum listing rental permissions) | `platform` **permission registry**; each module contributes its own permission catalog |
| `services/property` (property, unit, join codes, memberships UI) | `core/property` |
| `services/finance` charge configs, worksheets, meter readings, rent cycles, ledger | `core/finance` |
| `services/finance` leases, unit bookings, rent auto-billing rules | `verticals/rental` |
| `features/issue`, `features/announcement`, `features/analytics` | `core/community` |
| `features/inventory` | `verticals/rental` (move-in/out); revisit if societies need asset registers |

### Frontends
Apps stay split **by role, not by product**. Both apps show/hide features per property using `property_module_tbl`.

| App | Used by |
|---|---|
| **Landlord app** | Rental landlords, residential building admins, society managers/committee, staff |
| **Resident app** | Tenants (any product), unit owners (residential/society), family members (society) |

---

## 3. Entry points

- **A person** enters through `user_tbl`. One user can be admin of one property, owner of a flat in another and tenant in a third. `/api/v1/me/context` returns all of these links.
- **A place** enters through `property_tbl`. Every building record, screen and permission check starts with "which property?", then narrows to block → unit → member.

```
property_tbl (type: RENTAL | RESIDENTIAL | SOCIETY)
├── property_module_tbl       which features are on
├── membership_tbl            admin, staff, guards (property-wide access)
├── charge_config_tbl         what gets billed, and to which role
├── announcement_tbl, issue_tbl
└── block_tbl                 hidden default block, or Tower A / B
    └── unit_tbl              room or flat
        └── unit_member_tbl   OWNER / TENANT / FAMILY
            ├── lease_tbl     rental contract (tenants only; rental vertical)
            └── bill_tbl      rent or maintenance, exactly one payer
                ├── bill_line_tbl
                └── payment_transaction_tbl → finance_ledger_tbl
```

**Later — organisation above property.** Today the subscription belongs to the user who created the property. That breaks for a facility-management company running 20 societies, a society whose committee changes, or a vendor business with staff. An `organisation_tbl` that owns the subscription and its properties is needed before Society/Vendor. Until then, avoid new code that assumes "creator of the property = payer". Current spots with that assumption: `AuthFacadeImpl.findPropertyOwnerId` (matches title `"Owner"`) and the subscription/limit checks against the owner's plan (`SubscriptionEnforcementAspect`, `TeamMemberLimitValidator`).

---

## 4. Core data model

### 4.1 Table changes

| Table | Change | Owner |
|---|---|---|
| `property_tbl` | add `property_type` (`RENTAL` default) | core/property |
| `property_module_tbl` | start using it (entity exists, nothing reads it today); property type seeds default modules | core/property |
| `block_tbl` | **new** — `id, property_id, name, sort_order`; rental/residential get one hidden default block | core/property |
| `unit_tbl` | add `block_id`; unique key moves from `(property_id, unit_number)` to `(block_id, unit_number)` | core/property |
| `unit_member_tbl` | **new** — see §4.3 | core/property |
| `charge_config_tbl` | add `billed_to_role` (`TENANT` default / `OWNER`) | core/finance |
| `bill_tbl` | **renamed from `rent_cycle_tbl`** — add `member_id` (payer, required), `bill_type` (`RENT`, `MAINTENANCE`, later `PARKING`, `AMENITY`, `PENALTY`); `lease_id` becomes nullable | core/finance |
| `bill_line_tbl` | renamed from `rent_cycle_charge_tbl` | core/finance |
| `finance_ledger_tbl` | add `member_id`; running balance per payer | core/finance |
| `lease_tbl`, `unit_booking_tbl`, `lease_inventory_assignment_tbl` | unchanged, moved to rental | verticals/rental |
| `visitor_tbl`, `amenity_tbl`, `amenity_booking_tbl` | **new, later** | verticals/society |

Everything else (`user_tbl`, `auth_identity_tbl`, `membership_tbl`, `membership_permission_tbl`, `payment_transaction_tbl`, `notification_log_tbl`, `issue_tbl`, `announcement_tbl`, …) is unchanged.

### 4.2 Property types and modules

| Type | Default modules |
|---|---|
| `RENTAL` | units, leases, bookings, rent billing, meter readings, inventory, issues, announcements, analytics |
| `RESIDENTIAL` | units, ownership, maintenance billing, owner rent-out, issues, announcements |
| `SOCIETY` | residential defaults + blocks, visitors, amenities, parking, committee, polls (each switchable) |

Code checks **modules**, not types (`isModuleEnabled(propertyId, VISITORS)`), so there are no scattered `if type == …` branches.

### 4.3 `unit_member_tbl` — who belongs to a flat

```
unit_member_tbl
  id, unit_id, user_id,
  role        OWNER | TENANT | FAMILY
  is_primary
  lease_id    nullable, set for TENANT
  from_date, to_date (null = current), is_active
  assigned_by_id, created_at, updated_at
```

- The **single answer** to "who belongs to this flat". Announcements, issues, resident context and (later) visitor approvals read it — never `lease_tbl`.
- Rental: creating a lease also creates a `TENANT` member. Roommates = several `TENANT` members on one unit (matches today's multiple leases per unit).
- Residential/Society: admin assigns an `OWNER`; owner may add `FAMILY`; renting out creates a lease + `TENANT` member.
- Rules: at most one active primary `OWNER` per unit; an owner and a tenant can be active on the same unit; selling a flat = end the owner row, create the next one.

### 4.4 Occupancy
- Rented = active `TENANT` member.
- Owner-occupied = active `OWNER`, no active `TENANT`.
- Vacant = neither.
- Capacity checks count `TENANT` members only.

### 4.5 Bills

Every bill has **exactly one payer** (`member_id`). This keeps core finance free of leases.

| Product | Bill | Payer | Line items |
|---|---|---|---|
| Rental | `RENT` | tenant member (with `lease_id`) | base rent + all `billed_to_role = TENANT` charges + meter/worksheet entries (as today) |
| Residential / Society | `MAINTENANCE` | owner member | `billed_to_role = OWNER` charges, no base rent |
| Residential / Society, flat rented out | `RENT` | tenant member (with `lease_id`) | base rent from the lease only (v1) |

- Batch generation moves to a background job for Society-scale properties (today `batchGenerate` loops inside one HTTP request).
- Ledger balance is per payer, so an owner's maintenance and their tenant's rent on the same flat never mix.

### 4.6 Worked example — flat 102, residential, rented out

| Table | Rows |
|---|---|
| `unit_member_tbl` | A = Ravi, OWNER · B = Amit, TENANT, `lease_id` L1 |
| `lease_tbl` | L1 = Amit, rent 15000, deposit 30000 |
| `bill_tbl` (Sep) | B1 = MAINTENANCE, payer A · B2 = RENT, payer B, lease L1 |
| `finance_ledger_tbl` | Ravi's balance, Amit's balance — separate |

Visibility: building admin sees B1 only · Ravi sees B1 and B2 · Amit sees B2 only.

### 4.7 Migration (single Flyway version, dev stage)
1. Create `block_tbl`; one default block per existing property; set `unit_tbl.block_id`; swap the unique key.
2. Create `unit_member_tbl`; one `TENANT` member per active lease.
3. Rename `rent_cycle_tbl` → `bill_tbl`, `rent_cycle_charge_tbl` → `bill_line_tbl`; add `member_id` (backfill from lease → member), `bill_type = RENT`; make `lease_id` nullable.
4. Add `member_id` to `finance_ledger_tbl` (backfill from lease), `billed_to_role` to `charge_config_tbl`, `property_type` to `property_tbl`.
5. Hibernate runs in `validate` mode — entities and migration must land in the same commit.

---

## 5. Roles, permissions and onboarding

### 5.1 Where access comes from

| Who | Source | Scope | Controlled by |
|---|---|---|---|
| Building admin / landlord / society manager | `membership_tbl`, `FULL_ACCESS` | whole property | automatic on create |
| Staff (manager, accountant, guard later) | `membership_tbl` + picked permissions (join code) | whole property, chosen modules | admin |
| Unit owner | `unit_member_tbl` role `OWNER` | own unit only | admin assigns; rights fixed in code |
| Tenant | `unit_member_tbl` role `TENANT` (+ lease) | own lease and bills | landlord / unit owner |
| Family (society) | `unit_member_tbl` role `FAMILY` | view unit, raise issues | owner |

**Unit members never get a membership row.** Memberships are property-wide (would leak every flat), they count against `MAX_TEAM_MEMBERS`, and an owner's rights over their flat shouldn't be editable from the staff screen.

### 5.2 One authorization rule
`AuthorizationServiceImpl.hasPermission(resourceType, id, code)` allows if **either**:
1. the user's property membership grants `code` (today's logic), or
2. the resource resolves to a unit (`ResourceScope.Property` gains `unitId`) and the user's active `unit_member` role on that unit grants `code`, via a role → permissions map:

| Role | Permissions on that unit |
|---|---|
| `OWNER` | `PROPERTY_VIEW`, `LEASE_VIEW`, `LEASE_CREATE`, `LEASE_UPDATE`, `RENT_ROLL_VIEW`, `RENT_ROLL_MANAGE` (rent bills only), `ISSUE_VIEW`, `ISSUE_MANAGE`, pay own maintenance |
| `TENANT` | view own lease, pay own bills, `ISSUE_VIEW` (own), raise issues |
| `FAMILY` | view unit, raise issues |

- Replaces the current `LEASE_VIEW_OWN` special case (`AuthorizationServiceImpl.java:95`).
- `platform/auth` reads unit members through an SPI (`UnitMemberProvider`) implemented in core/property — no module cycle.
- Maintenance bills never resolve to owner-manage rights: an owner can pay their maintenance but not publish or mark it paid.
- Property-id-only checks (`hasPermission(propertyId, code)`) are unchanged — unit members never gain property-wide rights.

### 5.3 Permission registry
`StaffPermission` is replaced by per-module catalogs registered with platform. The staff permission picker shows only modules enabled for that property (e.g. residential hides Leases and shows "Maintenance" instead of "Rent roll"). Codes stay stable.

### 5.4 Onboarding

**Signup mode (`UserMode`) is only a UI preference** — which home screen opens first. It never grants permissions. Fix: join codes currently force `UserMode.RENTAL` (`PropertyJoinCodeServiceImpl.java:142`); derive it from the property type instead.

| Flow | Steps | Tables written |
|---|---|---|
| Set up a building | sign up → pick product → create property → add blocks/units → assign owners → invite staff | `user_tbl`, `auth_identity_tbl`, `property_tbl`, `property_module_tbl`, `membership_tbl`, `block_tbl`, `unit_tbl`, `unit_member_tbl` |
| Flat owner | admin assigns by phone → owner signs up in resident app with that phone → member row linked → My Home | `unit_member_tbl` (pending → linked to `user_id`) |
| Tenant | landlord or unit owner creates lease | `lease_tbl`, `unit_member_tbl` |
| Staff | join code | `membership_tbl`, `membership_permission_tbl` |

Pending members: if the admin assigns a phone with no account, store the member with the phone and no `user_id`; attach it on signup/login with that verified phone.

UI label: show "Building admin" on residential/society; the stored membership title stays `"Owner"` until `findPropertyOwnerId` stops depending on it.

---

## 6. Flows side by side

| Step | Rental | Residential | Society |
|---|---|---|---|
| **1. Create** | landlord → `property_tbl` RENTAL, `membership_tbl` FULL | building admin → `property_tbl` RESIDENTIAL, `membership_tbl` FULL | manager/committee → `property_tbl` SOCIETY, `membership_tbl` FULL |
| **2. Structure** | default `block_tbl` → `unit_tbl` | default `block_tbl` → `unit_tbl` | Tower A/B `block_tbl` → `unit_tbl` |
| **3. People** | `unit_booking_tbl` → `lease_tbl` + `unit_member_tbl` TENANT | `unit_member_tbl` OWNER; if rented: `lease_tbl` + `unit_member_tbl` TENANT | `unit_member_tbl` OWNER/FAMILY/TENANT; guards/staff → `membership_tbl` |
| **4. Charges** | `charge_config_tbl` → TENANT | `charge_config_tbl` → OWNER | `charge_config_tbl` → OWNER (per sq ft, sinking fund, parking) |
| **5. Monthly bill** | `meter_reading_tbl`, `billing_worksheet_entry_tbl` → `bill_tbl` RENT + `bill_line_tbl` | `bill_tbl` MAINTENANCE per owner; `bill_tbl` RENT per tenant if rented | background job → `bill_tbl` MAINTENANCE per owner |
| **6. Payment** | `payment_transaction_tbl` → `bill_tbl` PAID → `finance_ledger_tbl` → `notification_log_tbl` | same | same |
| **7. Day to day** | `issue_tbl`, `announcement_tbl`, `lease_inventory_assignment_tbl` | `issue_tbl` (common area + flat), `announcement_tbl` to all members | + `visitor_tbl`, `amenity_booking_tbl`, notices per tower |

---

## 7. Residential specifics

### 7.1 Actors
```
Building admin ──(maintenance)──▶ Unit owner ──(rent)──▶ Tenant
```

### 7.2 Screens

**Landlord app — building admin**
1. Create property: Rental / Residential / Society.
2. Units grid: owner name, occupancy badge, assign/change owner.
3. Charges: billed to owners; no RENT config.
4. Maintenance roll, ledger, analytics — no tenant rent amounts.
5. Issues: common area, owner-occupied flats, escalations.
6. Staff with residential permission catalog.

**Resident app — unit owner**
- **My Home**: maintenance dues + pay, payment history, notices, raise issue.
- **My Tenant** (only after renting out):

| Screen | API |
|---|---|
| Add tenant | `POST /finance/leases` |
| Tenant & lease details, edit terms, notice, end lease | `GET/PUT /finance/leases/{id}` |
| Generate / publish rent | `POST /rent-cycles/generate`, `/{id}/publish` (renamed with `bill_tbl`) |
| Record cash/UPI | `POST /rent-cycles/{id}/cash` |
| Payment history | `GET /rent-cycles?unitId=` |
| Tenant's issues | issues filtered by unit |

Not shown to owners: worksheets, meter readings, batch billing, analytics, staff. Unit switcher when a user owns several flats. An investor renting out many flats should use the landlord app with a rental property instead.

**Resident app — tenant**: unchanged.

### 7.3 Issues
- Resident can raise issues with an active `OWNER` or `TENANT` membership on a unit in that property.
- `COMMON_AREA` → admin · owner-occupied `UNIT` issue → owner + admin · tenant's `UNIT` issue → tenant + unit owner, admin only if escalated.

---

## 8. Society and later verticals

| Vertical | Needs beyond core |
|---|---|
| **Society** | real blocks/towers; visitors/gate with near real-time approval; amenities & bookings; parking; committee & polls; per-sq-ft charges (`unit_tbl.area` + new calculation strategy); society accounting (vendors, expenses, audit); background batch billing |
| **Hostel** | bed level under unit (or members per bed); meals; attendance |
| **Vendor marketplace** | vendor accounts not tied to a property; catalog, orders, delivery status, ratings, location search; society manager approves vendors; commission. Uses platform auth/payment/notification and core property only for "nearby buildings". A separate build, not a toggle. |

---

## 9. Platform gaps (affect every vertical)

| Gap | Why it matters | Needed before |
|---|---|---|
| Payments settle to one Razorpay account (`RazorpayProperties`) | rent to landlords, maintenance to societies, payouts to vendors need split settlement — Razorpay Route + payout reconciliation | online rent to owners, Society, Vendor |
| Subscription owned by one user | organisations, committee changes, vendor businesses | Society, Vendor |
| Central permission enum | every vertical would edit platform | Restructure (phase 1) |
| Open security findings from 2026-09-13 review — phone-as-password, lockout, payment fail-open, invoice IDOR | more payers and money flows raise impact | Phase 0 |

---

## 10. Decisions

### Made
| # | Decision |
|---|---|
| ✔ | Layered structure: platform → core → verticals |
| ✔ | `lease_tbl` stays a rental contract; ownership is **not** a lease type |
| ✔ | `unit_member_tbl` in core is the single "who belongs to a flat" (replaces the separate ownership-table idea) |
| ✔ | Unit owners manage their tenant in the **resident app** |
| ✔ | Apps split by role, not by product |
| ✔ | `property_tbl` is the root for all building data; `user_tbl` is the root for a person |

### Open (defaults proposed)
| # | Question | Proposed default |
|---|---|---|
| D1 | Who pays maintenance on a rented flat? | Owner |
| D2 | Can the building admin see owner↔tenant rent? | No |
| D3 | How is rent collected in residential v1? | Owner records cash/UPI; online rent to owners after Razorpay Route |
| D4 | Who pays the SaaS subscription? | Building admin's plan now; organisation later |
| D5 | How are owners linked? | Admin assigns by phone, auto-link on signup (vs per-flat invite code) |
| D6 | Who can remove/transfer an owner? | Admin only; transfer-request flow later |
| D7 | Rename `rent_cycle_tbl` → `bill_tbl`? | Yes (cheap now) |
| D8 | `RESIDENTIAL` and `SOCIETY` as separate types, or one type + modules? | Separate types, both driven by modules |

---

## 11. Roadmap

| Phase | Deliverable | Size |
|---|---|---|
| **0** | Fix open security findings (§9) | S |
| **1** | **Restructure, no behaviour change**: packages → platform / core / verticals/rental; `services/billing` → `platform/subscription`; permission registry; update ArchUnit rules. Existing tests prove nothing broke. | M |
| **2** | **Core model**: `property_type`, modules in use, `block_tbl`, `unit_member_tbl`, `bill_tbl` rename + payer, ledger per member, migration + backfill. Announcements/issues/resident context read `unit_member`. | L |
| **3** | **Authorization**: unit-member role rule, SPI, drop `LEASE_VIEW_OWN` special case; `/me/context` returns unit links. | M |
| **4** | **Residential backend**: assign owner (+ pending by phone), maintenance bills, owner rent-out, D2 visibility, issues routing. | M |
| **5** | **Residential frontend**: landlord app (building admin) + resident app (My Home, My Tenant). | L |
| **6** | **Platform for scale**: Razorpay Route / split settlement, organisation accounts, background batch billing. | L |
| **7** | **Society vertical**: towers UI, visitors, amenities, parking, committee, per-sq-ft. | XL |
| **8** | Hostel, vendor marketplace. | XL |

Phases 1 and 2 must be separate PRs — never move packages and change the model together.

---

## 12. Tests

**Restructure (phase 1)**
- Full existing suite green with no test logic changes.
- ArchUnit: verticals don't depend on each other; core doesn't depend on verticals; platform doesn't depend on core/verticals.

**Core model (phase 2)**
- Migration backfill: every active lease has a `TENANT` member; every bill has a `member_id`; units unique per block.
- Occupancy (rented / owner-occupied / vacant) and capacity count `TENANT` only.
- Announcements reach each active member once; issues resolve residents from members.

**Authorization (phase 3)**
- Owner of unit A manages leases/rent on A; 403 on unit B.
- Owner can pay but not publish/mark paid their maintenance bill.
- Owner/tenant/family never pass property-level checks (`batch-generate`, charges, staff, analytics).
- Ended member loses access; tenant sees only own lease and bills.

**Residential (phase 4)**
- Maintenance bill has only `OWNER` charges; residential rent bill has only base rent.
- Maintenance and rent on the same flat keep separate ledger balances.
- Admin batch generation on residential creates maintenance bills only.
- Pending owner by phone links on signup.

**Rental regression (every phase)** — lease, booking, rent roll, payment, inventory, analytics flows behave as today.

---

## 13. Risks

| Risk | Mitigation |
|---|---|
| Package move breaks wiring or hides a behaviour change | Phase 1 is move-only; full suite + ArchUnit; separate PR |
| Code still reads leases to find residents after phase 2 | Remove resident lookups from rental facades; ArchUnit forbids core → rental |
| Backfill errors in `bill_tbl.member_id` / ledger | Migration verification queries in tests; dev data reset acceptable |
| Privilege escalation through unit-member role rule | One rule, role map in one place, negative tests per endpoint |
| Rename of rent cycles ripples through FE and API | Keep old endpoint paths as aliases during the transition, regenerate API clients |
| Society scale (1000 units) in synchronous flows | Background batch billing and notification fan-out before Society launch |
| Hidden "creator = payer" assumptions | Track `findPropertyOwnerId` and subscription checks; replace when organisations arrive |
