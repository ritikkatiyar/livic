# Livic — Platform Architecture & Roadmap

> **Status**: Draft for discussion · **Last updated**: 2026-09-20 · **Base**: `main` @ `a113250`
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
└── block_tbl              one per property by default, N when there are several buildings
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
| `block_tbl` | **new** — `property_id, name, sort_order`, `is_default`; every property gets an auto-created `"Main"` block, and **any type may have several** — see §4.2a | core/property |
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

### 4.2a Blocks belong to every property type

A block is **not a society feature**. The schema has never restricted it — `unit_tbl`'s unique
key is `(block_id, unit_number)`, so Building A/101 and Building B/101 already coexist, and
`block_tbl` is unique on `(property_id, name)` with no type check anywhere. A landlord with
two buildings on one plot, or a row-house colony, must not be forced into two properties:
that splits their staff, charge configs, rent roll and analytics, which is the exact pain
blocks were introduced to remove.

The correct framing is **any property has N blocks; one is created automatically so simple
properties never meet the concept.** All four shapes are legal and need no special cases:

| Shape | Status |
|---|---|
| 1 property, 1 block | today's rental/residential — the auto-created `"Main"` block |
| 1 property, N blocks | schema ready; needs the API and the UI level |
| N properties, 1 block each | already live — the seed loops `mom's pg 1..N` for one owner |
| N properties, N blocks each | falls out of the above |

**When is it a block and when is it a separate property?** A block is a *physical* grouping;
a property is an *administrative boundary*. That is what the schema already enforces —
everything keyed on `property_id` is shared across all of its blocks: `membership_tbl` (staff,
guards), `charge_config_tbl`, announcements, issues, join codes, `invoice_prefix`. So two
buildings sharing staff, charges and books are one property with two blocks; two buildings
needing separate books are two properties.

**This rule is a pricing surface, not only a modelling preference.** `PropertyLimitValidator`
counts properties and `UnitLimitValidator` counts units; **blocks are uncounted**. Modelling
two buildings as blocks consumes one property of the plan, as properties it consumes two, and
the unit count is identical either way. That asymmetry pushes people toward the correct choice,
but it does mean someone will eventually collapse properties into blocks to fit a cheaper
plan — units being counted independently is what keeps that mostly honest. Revisit if block
counts ever become large.

**`sort_order` (resolved — was open decision 1).** Keep it. It is the manual display order of
blocks within a property, so a committee's "Tower A, B, C" survives and name sorting does not
break on "Tower 10". It is already in V1, the entity and the one list query; removing it is
four edits of churn to save one `int` on a table holding single digits of rows.
**But the ordering is a live bug:** nothing writes a value other than `0`, so
`findByPropertyIdOrderBySortOrderAsc` reads as deterministic and is not — InnoDB may return
blocks in any order. Add the tiebreaker:
`findByPropertyIdOrderBySortOrderAscNameAsc`. Invisible today with one block per property;
it surfaces the moment a second one exists.

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
| Society | visitors/gate, amenities, parking, committee and polls, per-sq-ft charges, society accounting (vendors, expenses, audit), background batch billing, dues-follow-flat and no-dues certificate |
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

**Made:** blocks belong to every property type, one auto-created default (§4.2a); a block is a physical grouping and a property an administrative boundary; layered structure; incremental restructure; `lease_tbl` stays the rental contract; `unit_member_tbl` is the single residency record; payer-and-issuer bills with two renames; unit owners use the resident app; apps split by role; listings work with or without a managed unit; marketplace is two-way.

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
| D14 | Can a rental have several blocks | Yes — any type, any number; `is_default` hides the level for the single-block case |
| D15 | Block vs separate property | Shared staff, charges and books → one property with blocks; separate books → separate properties |

---

### Parked (not in scope now)
**Living ecosystem / personal home** — an individual managing their own bills with no managed building behind them. Would need: property type `PERSONAL` (self-managed, one unit), `bill.source` (SYSTEM / MANUAL / EXTERNAL-BBPS), `bill.visibility` (PROPERTY / PRIVATE — a resident's personal bills must stay invisible to a society admin), and a `living` vertical (personal bills, reminders, documents, flatmate expense split, home services). The spine in §4 already supports it; revisit after residential.

## 12a. Where the work stands (handoff, 2026-09-20)

**Branch:** `feat/core-model-member-readers` (pushed; one PR open against `main`). All work below is on it.

### Done
| Commit | What |
|---|---|
| `96b95c2` | Invoice access scoped to tenant and staff; rent cycles resolve through their lease |
| `8f14653` | Razorpay verification fails closed (missing/blank/forged signature, unconfigured secret) |
| `cf2d7d0` | `block_tbl`, `unit.block_id`, unique key per block, `RESIDENTIAL` property type |
| `db46eb5` | `unit_member_tbl` + lease sync (created and ended with the lease, in one transaction) |
| `93d6f9e` | Announcements, issues and `/me/context` read members, not leases |
| `3646c0a` | Packages split into `platform` / `core` / `verticals`; ArchUnit enforces direction; subscription usage SPI |
| `08b4c0d` | Migrations collapsed to V1 (schema) + V2 (seed), seed fixed for blocks and members |
| `a5996ff` | 405 for wrong method (was 500); cross-property rent roll 403 (was silent empty page) |
| `ebc413a` | Marketplace FE badge label for RESIDENTIAL |
| `be0abc7` | Backend skill documents the new layering, so the PR review agent checks against it |

**Verified:** 222 backend tests green against MySQL; full rental flow exercised end to end on the fresh seed (landlord layout/rent roll/cash payment/ledger/notice, resident context/invoice/issue, marketplace search/OTP/tour/approval, payment 400 on forgery); cross-owner isolation probed both ways between `owner@livic.com` and `owner@moms.com` with no leaks.

**Local dev:** `docker compose up -d mysql`, then `mvn spring-boot:run -Dspring-boot.run.profiles=dev` in `backend/`. Seed password for every seeded user is `Adm!n@super`. Marketplace dev OTP is `000000`. Kill a stuck app by listening port, not `pkill`.

### Next: slice 1d, in two commits
**1d-i — bills**
- `rent_cycle_tbl` → `bill_tbl`, `rent_cycle_charge_tbl` → `bill_line_tbl`
- `bill.member_id` (payer, required) and `issued_by_member_id`; `bill_type`; `invoice_no` (gapless per property per financial year)
- **No `lease_id` on the bill.** The payer member already carries `lease_id`, so rental answers "bills for lease X" with one join through `unit_member`. A second path would drift, and a rental foreign key has no business in a core table.
- `finance_ledger_tbl` gains `member_id`; its JPA relation to `LeaseTbl` must go, since leases leave core in 1d-ii
- Rent-roll queries that filter `rent_cycle.lease_id` need rewriting through the member, not renaming. Every query in `RentCycleRepository` filters `lease.id IN :leaseIds`; all of them change.

**Four corrections to the §4.1 shape, found while reviewing the current schema:**

1. **`bill_type` names a payer↔issuer relationship, not a charge category.** Two bills exist
   in §4.7 because Ravi owes the property and Amit owes Ravi — different payer, different
   issuer. Apply that test and most of the proposed future enum falls away: PARKING has the
   same payer and issuer as MAINTENANCE, so it is a *line*; a late fee is a line on the next
   bill. Only AMENITY plausibly earns bill-hood. Without this rule `bill_type` becomes a
   dumping ground and the service rots into `if (type == …)` branching. Note the collision
   already waiting: `charge_type` on the line table carries `MAINTENANCE` and `PENALTY`
   today, and the plan wants both as *bill* types.
2. **Make `billing_month` nullable, or the unique key blocks the types it is meant to
   support.** `(member_id, billing_month, bill_type)` with `billing_month CHAR(7) NOT NULL`
   is a recurring-billing assumption: an amenity booking happens three times a month, a
   penalty has no month. Nullable solves it by itself — InnoDB treats NULLs as distinct in a
   unique index, so recurring bills stay protected against double-generation while ad-hoc
   bills are simply unconstrained. No second table, no partial index (MySQL has none).
3. **Drop `payment_transaction_id` from the bill.** It is a dead column — declared at
   `RentCycleTbl.java:50` and never read or written anywhere. It is also wrong in principle:
   `FinancePaymentEventListener` accumulates partial payments into `amount_paid`, so a bill
   has *many* transactions, and `payment_transaction_tbl` already points back via
   `reference_type` + `reference_id`. Carrying one FK forward invites someone to use it.
4. **`status` and `bill_type` as `VARCHAR(32)`, not MySQL `enum`.** This is the same
   reasoning §4.2 already used to avoid a migration for `property_type`; reintroducing enums
   here would be inconsistent.

**Bill lines are immutable once published.** `tax_rate`, `amount` and description are frozen
at generation and never re-derived from `charge_config_id` at render time — the FK is for
traceability only. Otherwise last month's invoice changes silently when someone edits a
charge config, which breaks the gapless-numbering compliance story the rename is paying for.

**1d-ii — leases leave core**
- **Confirmed still outstanding:** `LeaseTbl`, `LeaseController` and `LeaseService` all sit in `core/finance` today, and `verticals/rental` contains only `inventory`. 24 files under `core` reference the lease.
- **ArchUnit cannot catch this**, which is worth stating plainly: the rules forbid `core → verticals`, and the lease is *in* core — its misplacement is exactly what makes it legal. The direction rules will only start protecting the boundary once the move happens, so nothing will remind us.
- `lease_tbl`, bookings, `LeaseService`, `LeaseController`, the lease scope resolver and the `UnitOccupancyProvider` implementation move to `verticals/rental`
- Rent generation moves with them: rental reads the lease, builds the lines, asks core's bill service to write them
- Bills stay in core: a maintenance bill is sent to an owner who has no lease, so core must be able to bill without rental

**Also agreed, folds into the same work:** `total_floors` moves from `property_tbl` to `block_tbl` (a tower has floors, a location does not). Keep `totalFloors` in the property API response, derived from blocks, so the landlord app's five touchpoints keep working; create still accepts it and routes it to the default block.

Once §4.2a is accepted, this move stops being cosmetic: with Building A on 3 floors and
Building B on 5, `property_tbl.total_floors` has no correct value — max and sum are both
lies. The derived `totalFloors` on the property response is therefore a **temporary shim**
for `useCreateProperty`, `useEditProperty` and `PropertyCard`, not something to keep.

### The block UI — the real cost of §4.2a
No client can create a block today: there is no `BlockController`, no DTO, no entry in the
generated FE client. `getOrCreateDefaultBlock` is the only creation path. Adding the endpoint
is thin — create, list, rename, delete-if-empty; no migration and no backfill, since every
property already has exactly one block.

**What is not thin is the floor navigation, and it breaks as soon as a second block exists —
not at Society.** `unit_tbl.floor` is a plain `int` on the unit, so floors are not a table but
a grouping, and today that grouping is property-wide:

- `getFloorSummaries(propertyId, token, property.totalFloors)` buckets *every* unit in the
  property by floor number, so Building A floor 1 silently merges with Building B floor 1
- the route `/properties/[id]/floors/[floorNumber]` cannot address which building
- unit generation keys on `startingFloorNumber` alone

The fix is scoping, not new tables: group by `(block_id, floor)`, and put a block segment in
the route — `/properties/[id]/blocks/[blockId]/floors/[floorNumber]`. It must ship **with**
the block UI, not after it.

**Progressive disclosure keeps today's landlords unaffected.** `is_default` is the hinge:
exactly one block and it is the default → hide the block level entirely, and rental and
residential keep the screens they have now. A second block makes the level appear. Because
the default block is named `"Main"`, adding block #2 must prompt the landlord to rename the
first — nobody should be left with "Main" and "Building B".

### Open decisions
1. Schema changes: edit V1/V2 in place and drop the volume again (preferred, keeps the two-file rule) or add a V3.
2. `AnnouncementDTOs`-style wrapper classes: the PR review agent wants top-level DTO records. Pre-existing pattern across the codebase — bless it in the skill, or schedule the cleanup.

### Known gaps, deliberately not fixed
- Phase 0 leftovers: lockout counters are never written; `createTenant` still sets `passwordHash = encode(phone)`.
- The lease/member invariant holds because `LeaseServiceImpl` is the only writer. Reconciliation should assert it when the outbox lands (1e).
- Frontend builds are not run on every backend change; the RESIDENTIAL enum broke the marketplace build once. Run all three app builds before pushing.

---

## 13. Roadmap

**Next quarter — the spine and residential**

| Phase | Deliverable | Size |
|---|---|---|
| **0** | Open security findings | S |
| **1** | **Core model**, in slices: (a) `block_tbl` + `unit.block_id` + `RESIDENTIAL` type — **done, migration V24**; (b) modules in use; (c) `unit_member_tbl`; (d) bill rename + payer/issuer + `invoice_no`, ledger per member and per unit; (e) outbox; (f) blocks for every property type — `BlockController`, block level in the units navigation, floor grouping scoped to `(block_id, floor)`, §4.2a. Property and finance packages move as part of this work. Announcements, issues and resident context read members. | L |
| **2** | **Authorization**: unit-member role rule, `UnitMemberProvider` SPI, drop `LEASE_VIEW_OWN`, permission registry, `/me/context` returns unit links | M |
| **3** | **Residential**: assign owners, maintenance bills, owner-issued rent, rent privacy, issue routing, landlord + resident screens | M |

**After that**

| Phase | Deliverable |
|---|---|
| **4** | **Marketplace supply**: `listing_tbl`, standalone listings with no account, leads on listings, locality and geo, listing projection + privacy line; `features/marketplace` → `verticals/marketplace` |
| **5** | **Two-way marketplace**: list from a managed property, live status via outbox events, booking → lease, conversion wizard; `community` and `inventory` packages move |
| **6** | **Platform for scale**: Razorpay Route, organisations, background batch billing, deposit settlement, idempotency keys |
| **7** | **Society**: visitors, amenities, parking, committee, per-sq-ft, dues on sale (the blocks UI is no longer here — see phase 1f) |
| **8** | Hostel; vendor marketplace; brokers and lead economics |

Phase 1 is the one big change. Everything after it is additive — which is the point of doing it first.

---

## 14. Tests

- **Core model (1):** backfill — every active lease has a TENANT member, every bill a payer, units unique per block; a rental property accepts a second block and the same unit number in both; block listing order is stable across repeated calls; a single-default-block property exposes no block level; occupancy and capacity count TENANT only; announcements reach each member once; invoice numbers gapless per property per year; outbox row written in the same transaction and consumed once.
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
