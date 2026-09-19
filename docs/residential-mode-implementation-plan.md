# Livic — Platform Architecture & Roadmap

> **Status**: Draft for discussion · **Last updated**: 2026-09-19 · **Base**: `main` @ `a113250`
> **Supersedes**: the residential-only plans (ownership as a lease type; a separate `unit_ownership_tbl`). Both are replaced by the core model in §4.
> **Stage**: development — destructive schema and package changes are acceptable.

**Strategy in one line:** fix the spine first — property → block → unit → unit member, payer-based bills, one permission rule — and then residential, society, hostel and the marketplace are additions on top rather than rewrites.

---

## 1. The product

```
Marketplace  — public portal: anyone lists a flat, room, house or plot to rent or sell;
               prospects search, book visits, pay a token.        ← traffic and supply
       ↕  two-way
Management   — the SaaS: rental, residential and society buildings;
               people, billing, payments, issues, notices.        ← revenue
```

| Line | What it is | Status |
|---|---|---|
| **Marketplace** | Listings, leads, tours, bookings | Partly built (PRs #60, #61) |
| **Rental** | Landlord rents rooms/flats to tenants | Live |
| **Residential** | One building, each flat owned by a different person | Next, small once the spine lands |
| **Society** | Many towers, committee-run, gate, amenities | After |
| **Hostel** | Beds instead of flats, meals, attendance | Later |
| **Vendor marketplace** | Local vendors selling to residents (Whimsical board) | Later, separate from the property portal |

Residential is Society with fewer modules switched on — not its own module.

---

## 2. Architecture

```
platform/     auth, user, security, payment gateway, notification, storage,
              subscription (from services/billing), permission registry, outbox
   ▲
core/         property   property, block, unit, unit_member
              finance    charges, bills, bill lines, ledger, invoices, readings
              community  issues, announcements, documents, analytics
   ▲
verticals/    rental      leases, bookings, deposits, roommate split, inventory
              society     ownership transfer, committee, visitors, amenities, parking
              marketplace listings, search, leads, tours (works with or without a unit)
              later       hostel, vendor marketplace
```

**Rules (ArchUnit):** `verticals → core → platform`, never upward; no vertical depends on another; core reaches a vertical only through an SPI or an event; marketplace may reference a core unit but must work without one.

### Restructure — done
The move landed in one commit (packages only, no behaviour change), and the ArchUnit rules
now enforce the direction rather than describing it:

| Was | Now |
|---|---|
| `services/property` | `core/property` |
| `services/finance` | `core/finance` (leases and bookings move to `verticals/rental` with the bill rename) |
| `features/announcement`, `features/issue`, `features/analytics` | `core/community` |
| `features/inventory` | `verticals/rental/inventory` |
| `features/marketplace` | `verticals/marketplace` |
| `services/billing` | `platform/subscription` |

The layering immediately caught subscription enforcement reaching into core to count
properties and units; it now asks through `PropertyUsageProvider`, declared in platform and
implemented in core. `.agents/skills/backend-engineering/SKILL.md` documents the new layout,
so the PR review agent checks against it.

### Apps (split by role, not product)
| App | Stack | Used by |
|---|---|---|
| Marketplace | Next.js `livic-marketplace-fe` | Public prospects, buyers, renters (SEO) |
| Landlord | Expo `livic-landlord-fe` | Landlords, building admins, society managers, staff |
| Resident | Expo `livic-resident-fe` | Tenants, unit owners, family |

---

## 3. Entry points

- **A person** enters via `user_tbl`; `/api/v1/me/context` returns every link (memberships and unit memberships).
- **A place** enters via `property_tbl` — except a marketplace listing, which may exist with no property at all.

```
property_tbl (RENTAL | RESIDENTIAL | SOCIETY)
├── property_module_tbl    which features are on
├── membership_tbl         admin, staff, guards (property-wide)
├── charge_config_tbl      what is billed, to which role
├── announcement_tbl, issue_tbl, document_tbl
└── block_tbl              hidden default block, or Tower A / B
    └── unit_tbl           room or flat
        ├── listing_tbl    optional marketplace projection
        └── unit_member_tbl  OWNER / TENANT / FAMILY
            ├── lease_tbl  tenant contract (rental vertical)
            └── bill_tbl   one payer, one issuer
                ├── bill_line_tbl
                └── payment_transaction_tbl → finance_ledger_tbl
```

**Later — `organisation_tbl` above property.** Subscriptions belong to the user who created the property, which breaks for facility-management firms, committee handovers and broker/vendor businesses. Avoid new "creator = payer" assumptions; the existing ones are `AuthFacadeImpl.findPropertyOwnerId` (matches title `"Owner"`), `SubscriptionEnforcementAspect`, `TeamMemberLimitValidator`.

---

## 4. Core model (the spine)

### 4.1 Renames — exactly two
| From | To | Change |
|---|---|---|
| `rent_cycle_tbl` | `bill_tbl` | add `member_id` (payer, required), `issued_by_member_id` (null = the property itself), `bill_type` (`RENT`, `MAINTENANCE`, later `PARKING`, `AMENITY`, `PENALTY`), `invoice_no`; `lease_id` nullable; unique key → `(member_id, billing_month, bill_type)` |
| `rent_cycle_charge_tbl` | `bill_line_tbl` | `rent_cycle_id` → `bill_id`; add `tax_rate`, `tax_amount` |

Everything else keeps its name and only gains columns.

### 4.2 Table changes
| Table | Change | Owner |
|---|---|---|
| `property_tbl` | `invoice_prefix`. **`property_type` already exists** (V19, marketplace) as RENTAL/HOSTEL/SOCIETY/MESS/INDIVIDUAL — `RESIDENTIAL` added to the enum; the column is VARCHAR(32) so no migration was needed. `is_publicly_listed` also already exists. | core/property |
| `property_module_tbl` | start using it; type seeds the default module set | core/property |
| `block_tbl` | **new** — `property_id, name, sort_order`; rental/residential get one hidden default | core/property |
| `unit_tbl` | `block_id` (unique key moves from `(property_id, unit_number)` to `(block_id, unit_number)`), optional `area`. **Already exists** from the marketplace work: `base_price`, `is_bookable`, `description`, `amenities` — `is_bookable` is the per-unit listing switch the plan called `is_listed`. | core/property |
| `unit_member_tbl` | **new** — §4.3 | core/property |
| `charge_config_tbl` | `billed_to_role` (TENANT default / OWNER), optional `unit_id` for owner-specific charges, `tax_rate` | core/finance |
| `finance_ledger_tbl` | `member_id`, `unit_id` kept — balance per payer **and** per unit (dues follow the flat on sale) | core/finance |
| `credit_note_tbl` | **new** — refunds, waivers, advances | core/finance |
| `document_tbl` | **new** — agreements, ID proofs, no-dues certificates, over `media_asset_tbl` | core/community |
| `audit_log_tbl` | **new** — ownership changes, bill edits, permission changes | platform |
| `outbox_tbl` | **new** — §4.6 | platform |
| `listing_tbl` | **new** — §5 | verticals/marketplace |
| `marketplace_lead_tbl` | `property_id` + `unit_id` (NOT NULL today) → `listing_id` | verticals/marketplace |
| `lease_tbl`, `unit_booking_tbl`, `lease_inventory_assignment_tbl` | unchanged, owned by rental | verticals/rental |
| `visitor_tbl`, `amenity_booking_tbl` | **new, later** | verticals/society |

### 4.3 `unit_member_tbl` — who belongs to a flat
```
id, unit_id, user_id (null while pending), role OWNER|TENANT|FAMILY,
is_primary, lease_id (tenants only), from_date, to_date, is_active, assigned_by_id
```
- The single answer to "who is in this unit" — used by announcements, issues, resident context, marketplace availability and later visitor approval. Nothing reads `lease_tbl` for this.
- **Why both member and lease for a rental tenant:** the member row answers *who is here* and lives in core; the lease answers *what was agreed* and lives in the rental vertical. Core cannot depend on rental, owners and family have no lease, and one lookup beats four.
- **Invariant:** creating a lease creates the member row in the same transaction; ending a lease sets `to_date` in the same transaction. Tested both ways.
- One active primary OWNER per unit; owner and tenant can be active together; a sale ends one owner row and opens the next.

### 4.4 Occupancy
Rented = active TENANT · Owner-occupied = active OWNER with no tenant · Vacant = neither. Capacity counts TENANT only.

### 4.5 Bills — one payer, one issuer
| Product | Bill | Payer | Issuer | Lines |
|---|---|---|---|---|
| Rental | RENT | tenant member | property | base rent + TENANT charges + readings |
| Residential / Society | MAINTENANCE | owner member | property | OWNER charges, no rent |
| Residential / Society, rented flat | RENT | tenant member | **owner member** | base rent from the lease (v1) |

`issued_by_member_id` is what makes the two-layer residential case explicit rather than inferred.

**Compliance built in from the start** (retrofitting numbering is painful):
- gapless `invoice_no` per property per financial year, from `invoice_prefix`
- `tax_rate` / `tax_amount` per line — societies crossing the GST threshold must charge it
- rent receipts for tenants (HRA claims)
- credit notes for refunds, waivers and advances
- TDS on rent: out of scope for v1, but the bill must be able to carry a deduction later

Batch generation moves to a background job at society scale.

### 4.6 Events — transactional outbox
Marketplace availability, notifications and analytics all ride on domain events. In-process Spring events are lost on crash or rollback, which would leave a rented room showing as vacant. So:
- write an `outbox_tbl` row in the same transaction as the change
- a publisher relays rows to consumers, consumers are idempotent (`event_id`)
- a nightly reconciliation job repairs any drift in the listing projection

### 4.7 Worked example — flat 102, residential, rented out
| Table | Rows |
|---|---|
| `unit_member_tbl` | A = Ravi, OWNER · B = Amit, TENANT, `lease_id` L1 |
| `lease_tbl` | L1 = Amit, rent 15000, deposit 30000 |
| `bill_tbl` (Sep) | B1 MAINTENANCE, payer A, issuer property · B2 RENT, payer B, issuer A |
| `finance_ledger_tbl` | Ravi's balance and Amit's balance, separate; unit 102 total for dues-on-sale |

Visibility: admin sees B1 · Ravi sees B1 and B2 · Amit sees B2.

---

## 5. Marketplace

### 5.1 What exists (PRs #60, #61)
`features/marketplace`: `marketplace_lead_tbl` (type, status, prospect name/phone/email, preferred slot, token amount, payment id, `converted_unit_booking_id`, decision fields), `otp_verification_tbl`, tour availability tables, landlord visiting-hours and tour screens, and the Next.js app. Migrations run to **V23**; next free number is **V24**.

**The blocker:** leads require `property_id` and `unit_id`, and public DTOs project managed properties — so only existing customers can have supply. A portal needs listing first, management later.

### 5.2 `listing_tbl`
```
id, source STANDALONE | MANAGED,
unit_id (null when standalone), owner_user_id (null before signup),
listing_type RENT | SALE, title, description, photos, amenities,
rent_or_price, deposit, address, locality, city, lat, lng,
status DRAFT | LIVE | PAUSED | RENTED | EXPIRED, published_at, expires_at
```
Conversion keeps the same row — it gains `unit_id` and `owner_user_id`, so leads, tours and the page URL survive (SEO). `marketplace_lead_tbl` points at `listing_id`.

### 5.3 Two-way flow
**Listing first:** standalone listing (no account) → leads and tours → owner signs up → wizard creates property, block, unit and OWNER member → listing becomes MANAGED, keeping its leads.

**Management first:** marketplace module on the property + `unit_tbl.is_listed` per room (never listed by default) → public sees live status → tour → token booking (`unit_booking_tbl`) → landlord accepts → lease + TENANT member → listing flips to RENTED and leaves the portal.

Who may list: landlord or admin any unit; residential/society **unit owner their own flat only**; a society admin can block flat-level listing.

| Public sees | Source |
|---|---|
| Available now | no active TENANT member |
| Available from 15 Oct | notice served, `move_out_date` |
| Occupied / hidden | active tenant |
| Rent, deposit | charge config or last lease |
| Room type, floor, furnishing, photos | unit + listing |

**Never public:** tenant identity, bills, ledger, documents, issues, who lives where. Public reads hit the listing projection, never live management queries — today's public DTOs read managed properties directly and must change.

### 5.4 Portal gaps beyond the listing
Locality/geo and map search · filters and a search engine when MySQL runs out · sale flow (negotiation, ownership proof, brokerage) · broker and builder accounts with lead credits · trust and moderation (verification, reporting, expiry, duplicates) · lead economics · media pipeline (resize, CDN) · OTP rate limits and bot protection.

---

## 6. Roles, permissions, onboarding

| Who | Source | Scope |
|---|---|---|
| Landlord / admin / society manager | `membership_tbl` FULL_ACCESS | whole property |
| Staff (manager, accountant, guard) | `membership_tbl` + picked permissions | whole property, chosen modules |
| Unit owner | `unit_member_tbl` OWNER | own unit |
| Tenant | `unit_member_tbl` TENANT (+ lease) | own lease and bills |
| Family | `unit_member_tbl` FAMILY | view unit, raise issues |
| Prospect | none, OTP only | public listings, own leads |

Unit members never get a membership row: memberships are property-wide, count against `MAX_TEAM_MEMBERS`, and an owner's rights shouldn't be editable from the staff screen.

**One authorization rule** — allow if the property membership grants the code, **or** the resource resolves to a unit (`ResourceScope.Property` gains `unitId`) and the caller's active member role grants it:

| Role | On that unit |
|---|---|
| OWNER | `PROPERTY_VIEW`, `LEASE_VIEW/CREATE/UPDATE`, `RENT_ROLL_VIEW/MANAGE` (rent bills only), `ISSUE_VIEW/MANAGE`, `LISTING_MANAGE`, pay own maintenance |
| TENANT | view own lease and bills, pay, raise issues |
| FAMILY | view unit, raise issues |

Replaces the `LEASE_VIEW_OWN` special case (`AuthorizationServiceImpl.java:95`). Platform reads members through an SPI (`UnitMemberProvider`). Maintenance bills never grant owner-manage rights — an owner pays but cannot publish or mark paid. Property-level checks are unchanged.

**Permission registry:** `StaffPermission` becomes per-module catalogs registered with platform; the picker shows only enabled modules (residential hides Leases, shows "Maintenance"). New code: `LISTING_MANAGE`.

**Onboarding:** `UserMode` is a UI preference only and never grants access; join codes must stop forcing `UserMode.RENTAL` (`PropertyJoinCodeServiceImpl.java:142`). Owners are assigned by phone and linked on signup (pending member with no `user_id`). UI says "Building admin" while the stored title stays `"Owner"` until `findPropertyOwnerId` changes.

---

## 7. Flows side by side

| Step | Rental | Residential | Society |
|---|---|---|---|
| **0. Marketplace** | landlord lists rooms; tour + token → `listing_tbl`, `marketplace_lead_tbl`, `unit_booking_tbl` | owner lists their own flat (rent or sale) | same, unless the society blocks it |
| **1. Create** | landlord → RENTAL | admin → RESIDENTIAL | manager/committee → SOCIETY |
| **2. Structure** | default block → rooms | default block → flats | towers → flats |
| **3. People** | booking → lease + TENANT member | admin assigns OWNER; owner adds TENANT | OWNER / FAMILY / TENANT; staff and guards |
| **4. Charges** | to TENANT | to OWNER | to OWNER (per sq ft, sinking fund, parking) |
| **5. Bill** | RENT per tenant | MAINTENANCE per owner + RENT per tenant | MAINTENANCE per owner, background job |
| **6. Payment** | payment → bill → ledger → receipt | same | same |
| **7. Day to day** | issues, notices, inventory | issues (common + flat), notices to all members | + visitors, amenities, per-tower notices |
| **8. Exit** | notice → move-out → deposit settled → relisted | tenant leaves, or flat sold → new OWNER | flat sold → dues follow the flat, no-dues certificate |

---

## 8. Residential (small, once the spine lands)

```
Building admin ──(maintenance)──▶ Unit owner ──(rent)──▶ Tenant
```
- **Backend:** assign owner (pending by phone), OWNER charge configs, maintenance bills, owner-issued rent bills, rent privacy from the admin, issue routing. No new core work.
- **Landlord app:** property type on create; units grid with owner and occupancy; charges billed to owners; maintenance roll and ledger without tenant rent; common-area issues.
- **Resident app — owner:** My Home (dues, pay, history, notices, issues) and My Tenant (add tenant, lease terms, notice, end lease, generate/publish rent, record cash/UPI, tenant's issues). Not shown: worksheets, readings, batch billing, analytics, staff.
- **Tenant:** unchanged.

## 9. Society and later

| Vertical | Needs beyond core |
|---|---|
| Society | towers UI, visitors/gate, amenities, parking, committee and polls, per-sq-ft charges, society accounting (vendors, expenses, audit), background batch billing, dues-follow-flat and no-dues certificate |
| Hostel | bed level under unit, meals, attendance |
| Vendor marketplace | vendor accounts not tied to a property, catalog, orders, ratings, society approval, commission — a separate build |

---

## 10. Platform gaps

| Gap | Needed before |
|---|---|
| One Razorpay account — rent to landlords, maintenance to societies, vendor payouts need Route + reconciliation | online rent to owners, society, vendors |
| Subscription owned by one user — no organisations | society, facility managers, brokers |
| Deposit settlement at move-out (refunds, damage deductions from inventory) | residential/rental exit flow |
| Idempotency keys on payments and webhooks | any payment scale |
| Synchronous batch billing | society |
| Open security findings (2026-09-13): phone-as-password, lockout, payment fail-open, invoice IDOR | now |

---

## 11. How we will know it works

- **Feature flags** per module so half-built verticals ship dark.
- **Seed and demo data** per product line — a demo society and a demo rental, for sales and for tests.
- **Funnel metrics** as events: listing created → lead → tour → booking → signup → first bill → first payment. The whole thesis is the funnel; it has to be measured.
- **Performance budget** for the portal: public listing page and search response time, cache hit rate.
- **Reconciliation dashboards:** listing projection drift, outbox lag, failed payments.

### Assumptions to validate with real users (before Society)
1. Do flat owners pay, or only the building admin?
2. Will societies switch without gate management?
3. Will owners list on a portal with no traffic yet, and what unlocks supply — free listings, or calling brokers?

---

## 12. Decisions

**Made:** layered structure; incremental restructure; `lease_tbl` stays the rental contract; `unit_member_tbl` is the single residency record; payer-and-issuer bills with two renames; unit owners use the resident app; apps split by role; listings work with or without a managed unit; marketplace is two-way.

**Open**
| # | Question | Proposed |
|---|---|---|
| D1 | Maintenance on a rented flat | Owner pays |
| D2 | Admin sees owner↔tenant rent | No |
| D3 | Rent collection in residential v1 | Cash/UPI recorded by owner; online after Route |
| D4 | Who pays the subscription | Admin's plan now; organisation later |
| D5 | How owners are linked | Assign by phone, auto-link on signup |
| D6 | Who removes/transfers an owner | Admin only |
| D7 | Rename rent cycle → bill | Yes |
| D8 | RESIDENTIAL and SOCIETY separate types | Separate, module-driven |
| D9 | Sale listings in v1 | Rent first |
| D10 | Brokers allowed to list | Owners only first |
| D11 | Auto-unlist when taken | Yes |
| D12 | Dues follow the flat on sale | Yes — ledger keeps a per-unit view |
| D13 | GST and invoice numbering in v1 | Yes, numbering from day one; GST when societies arrive |

---

### Parked (not in scope now)
**Living ecosystem / personal home** — an individual managing their own bills with no managed building behind them. Would need: property type `PERSONAL` (self-managed, one unit), `bill.source` (SYSTEM / MANUAL / EXTERNAL-BBPS), `bill.visibility` (PROPERTY / PRIVATE — a resident's personal bills must stay invisible to a society admin), and a `living` vertical (personal bills, reminders, documents, flatmate expense split, home services). The spine in §4 already supports it; revisit after residential.

## 13. Roadmap

**Next quarter — the spine and residential**

| Phase | Deliverable | Size |
|---|---|---|
| **0** | Open security findings | S |
| **1** | **Core model**, in slices: (a) `block_tbl` + `unit.block_id` + `RESIDENTIAL` type — **done, migration V24**; (b) modules in use; (c) `unit_member_tbl`; (d) bill rename + payer/issuer + `invoice_no`, ledger per member and per unit; (e) outbox. Property and finance packages move as part of this work. Announcements, issues and resident context read members. | L |
| **2** | **Authorization**: unit-member role rule, `UnitMemberProvider` SPI, drop `LEASE_VIEW_OWN`, permission registry, `/me/context` returns unit links | M |
| **3** | **Residential**: assign owners, maintenance bills, owner-issued rent, rent privacy, issue routing, landlord + resident screens | M |

**After that**

| Phase | Deliverable |
|---|---|
| **4** | **Marketplace supply**: `listing_tbl`, standalone listings with no account, leads on listings, locality and geo, listing projection + privacy line; `features/marketplace` → `verticals/marketplace` |
| **5** | **Two-way marketplace**: list from a managed property, live status via outbox events, booking → lease, conversion wizard; `community` and `inventory` packages move |
| **6** | **Platform for scale**: Razorpay Route, organisations, background batch billing, deposit settlement, idempotency keys |
| **7** | **Society**: towers, visitors, amenities, parking, committee, per-sq-ft, dues on sale |
| **8** | Hostel; vendor marketplace; brokers and lead economics |

Phase 1 is the one big change. Everything after it is additive — which is the point of doing it first.

---

## 14. Tests

- **Core model (1):** backfill — every active lease has a TENANT member, every bill a payer, units unique per block; occupancy and capacity count TENANT only; announcements reach each member once; invoice numbers gapless per property per year; outbox row written in the same transaction and consumed once.
- **Authorization (2):** owner manages leases and rent on their unit, 403 on another; owner pays but cannot publish or mark paid maintenance; members never pass property-level checks; ended member loses access.
- **Residential (3):** maintenance bill has only OWNER charges; residential rent bill only base rent; separate ledger balances; admin batch generates maintenance only; pending owner links on signup.
- **Marketplace (4, 5):** standalone listing with no account; lead attaches to a listing; conversion keeps leads and URL; managed listing shows vacant/vacating; public API exposes no tenant, bill or document data; listing flips to RENTED when a tenant member is created.
- **Rental regression (every phase):** lease, booking, rent roll, payment, inventory and analytics unchanged.
- **ArchUnit:** rules added in phase 1 as warnings, tightened to failures as each module lands.

---

## 15. Risks

| Risk | Mitigation |
|---|---|
| Phase 1 is large and touches billing | Land it behind flags, in reviewable slices (property → members → bills), with backfill verification queries |
| Code still reads leases to find residents | Remove resident lookups from rental facades; ArchUnit forbids core → rental |
| Events lost, listings show stale availability | Outbox + idempotent consumers + nightly reconciliation |
| Public marketplace leaks management data | Listing projection is an allow-list; tests assert the shape |
| Invoice numbering retrofit | Built in phase 1, not later |
| Privilege escalation via unit-member rule | One rule, one role map, negative tests per endpoint |
| Rename ripples through FE and API | Old endpoint paths kept as aliases during transition; regenerate clients |
| Building for untested demand | Validate §11 assumptions before Society |
