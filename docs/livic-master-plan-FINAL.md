# Livic Frontend — Master Plan (Final, Status-Verified)

Every item below was checked against the live codebase just now, not assumed from commit messages. This replaces all prior versions of this plan — treat this as the single source of truth going forward.

**Still pre-production** — breaking changes remain cheap. **Mobile is still the priority surface**; every open item must be verified on native mobile, not just desktop.

---

## APPROVED PRODUCT + DESIGN DIRECTION

The redesigned Landlord and Resident experiences have now been reviewed and approved in Figma. The Figma design is the visual/interaction reference for implementation; this document is the engineering plan that makes that design real.

**Approved Figma:** Livic — Dynamic Modules & Permissions
https://www.figma.com/design/jtGazIZGBEROPOLGK0Sgyb

The approved visual direction follows the Livic Visual Identity System: flat solid surfaces, warm neutral background, restrained teal accent, hairline borders, sentence-case typography, no glassmorphism, no decorative gradients, and responsive behavior across mobile/tablet/desktop.

The approved UX also establishes the new product access model: navigation and feature visibility are driven by effective module/feature access returned by the backend, while the backend remains the final authorization authority.

---

## CONFIRMED DONE / DO NOT RE-LITIGATE

- `GlassCard` dark-mode fix (`theme.Colors.glassFill`)
- Login screen dark-mode literals — 0 remaining
- Sidebar dark-mode hardcoded literals (`rgba(0.5)`, `#f59e0b`) — removed
- Duplicate dark-mode toggle — removed from `DesktopNavBar`, lives only in `SidebarNavigation`/`MobileMoreSheet`
- PR-review agent's stale folder-path bug — fixed; agent now actually reviews frontend files
- `frontend-engineering/SKILL.md` guardrails — landed on `main`
- Portfolio's fake stat cards (`'LIVE'`/`'READY'`/`'00'`) — replaced with real data
- Typography `PascalCase`/`camelCase` mixing in `SidebarNavigation` — resolved to one convention
- Global property-selection architecture — `PropertySelectionContext` is wired at `_layout.tsx`; desktop screens consume the shared selection state
- Backend `LazyInitializationException` on `BillingWorksheetRepository` — fixed (`JOIN FETCH`)
- **Approved full Landlord + Resident UI redesign in Figma** — implementation reference is the approved Figma file above

---

## 🔴 PRE-EXISTING OPEN ITEMS — EXECUTE, DON'T RE-DESIGN

| Item | Required action |
|---|---|
| **Mobile-nav wrong-device flash on Vercel** | Replace JS-computed device visibility with CSS media-query behavior for web. Verify first paint on desktop and mobile. Investigate the simultaneous stuck-spinner symptom. |
| **Mobile property selector** | Add a compact property trigger/sheet to `MobileHeader.tsx`, backed by the existing `PropertySelectionContext`. |
| **Triple-sidebar bug** | Remove the hand-rolled secondary sidebar from `EditPropertyScreen.tsx` and `CreatePropertyScreen.tsx`; use the canonical shell. |
| `rgba()` / `hsla()` color literals | Complete token migration. |
| Standalone `fontWeight` literals | Complete typography-token migration. |
| `PageShell` adoption | Continue adoption until all applicable screens use the canonical shell. |
| Screen decomposition | Continue reducing oversized screen/components below the established threshold. |
| Pagination | Finish rollout on remaining list-bearing screens. |
| Shared package extraction | Extract stable primitives into `packages/ui` only after the current UI cleanup stabilizes. |
| SQL migration guardrails | Add and enforce migration guardrails. |

---

# PART 13 — APPROVED DYNAMIC MODULE + FEATURE ACCESS ARCHITECTURE

This is the major product architecture change associated with the approved design. It replaces the assumption that the sidebar is a fixed list of screens.

## 13.1 — Core principles

1. `property_tbl` remains a physical property entity only.
2. Management context/type must not be stored as unrelated columns on `property_tbl`.
3. Modules are capabilities available to a property/product context.
4. Features live inside modules.
5. Permissions are the atomic authorization units.
6. Membership remains the user-to-property access relationship.
7. **Do not reintroduce `membership_role_tbl`.** The current `main` model uses membership `title` plus `AccessType` (`FULL_ACCESS` / `CUSTOM_ACCESS`) and explicit `membership_permission_tbl` rows.
8. Ownership and authorization are separate concepts.
9. Frontend visibility is derived from effective access; it is not the security boundary.
10. Backend authorization remains mandatory for every protected API operation.
11. Do not create arbitrary UNIT → PROPERTY permission inheritance. Scope inheritance only when a permission explicitly requires it.
12. Rental is the first management capability to be implemented fully; Society and Residential must not block the Rental rollout.

---

## 13.2 — Current backend access model to preserve

The current `main` branch already has the correct foundation:

```text
membership_tbl
 ├── user_id
 ├── property_id
 ├── title
 ├── access_type       FULL_ACCESS | CUSTOM_ACCESS
 ├── is_active
 └── assigned_by

membership_permission_tbl
 └── membership → permission

permission_tbl
 ├── code
 └── description
```

`MembershipServiceImpl` already supports creating/updating custom access and persists explicit permission codes for `CUSTOM_ACCESS`. `FULL_ACCESS` remains the unrestricted property-level access mode.

**Architecture decision:** extend this model rather than introducing a role table.

---

## 13.3 — Module catalog

Introduce a global module catalog rather than storing arbitrary module names on property records.

```text
module_tbl
 ├── id
 ├── code
 ├── name
 ├── description
 ├── icon
 ├── route
 ├── display_order
 └── is_active
```

The existing `property_module_tbl` should evolve from `module_name` to a foreign-key reference:

```text
property_module_tbl
 ├── property_id
 ├── module_id
 └── is_active
```

The migration must preserve existing property-module assignments while replacing string identity with stable module identity.

Initial module vocabulary should be derived from the approved product inventory, not invented ad hoc by individual screens. Candidate top-level modules include:

- PROPERTY_MANAGEMENT
- RENTAL
- FINANCE
- INVENTORY
- COMMUNICATION
- REPORTING_ANALYTICS
- AI
- ACCESS

The final seed list must be reconciled with the existing backend controllers and frontend routes before migration is finalized.

---

## 13.4 — Feature hierarchy

Modules are too coarse to represent the approved custom-access UX. Permissions therefore need feature context.

Target conceptual hierarchy:

```text
Module
  └── Feature
       └── Permission
```

Example:

```text
RENTAL
 ├── LEASES
 │    ├── LEASE_VIEW
 │    ├── LEASE_CREATE
 │    ├── LEASE_UPDATE
 │    └── LEASE_DELETE
 │
 ├── RENT
 │    ├── RENT_VIEW
 │    ├── RENT_GENERATE
 │    └── RENT_PAYMENT_VIEW
 │
 └── TENANTS
      ├── TENANT_VIEW
      └── TENANT_MANAGE
```

Whether `feature_tbl` is required or feature metadata can be represented directly on `permission_tbl` must be decided during the backend schema inspection. Do not create a redundant table if the existing permission model can represent the same hierarchy cleanly.

---

## 13.5 — Management type/context

Management type is a product context, not a physical property attribute.

Target model:

```text
management_type_tbl
 ├── id
 ├── code
 ├── name
 └── is_active

management_type_module_tbl
 ├── management_type_id
 ├── module_id
 └── enabled_by_default
```

Conceptually:

```text
MANAGEMENT TYPE
       ↓
DEFAULT MODULE MATRIX
       ↓
PROPERTY MODULE OVERRIDES
       ↓
MEMBERSHIP ACCESS
       ↓
FEATURE PERMISSIONS
       ↓
FRONTEND
```

Examples:

```text
RENTAL
  → Rental + Property + Finance + Inventory + Communication + Reporting + AI

SOCIETY
  → Society-specific modules + shared operational modules

RESIDENTIAL
  → Residential-specific modules + shared operational modules
```

The exact matrices must be finalized from the product requirements before seeding. Do not encode assumptions into `property_tbl`.

---

## 13.6 — Effective access API

Create one canonical endpoint for the frontend:

```http
GET /api/properties/{propertyId}/access
```

Target response shape:

```json
{
  "propertyId": "...",
  "accessType": "CUSTOM_ACCESS",
  "modules": [
    {
      "code": "RENTAL",
      "name": "Rental",
      "enabled": true,
      "features": [
        {
          "code": "LEASES",
          "visible": true,
          "permissions": [
            "LEASE_VIEW",
            "LEASE_CREATE",
            "LEASE_UPDATE"
          ]
        },
        {
          "code": "RENT",
          "visible": true,
          "permissions": [
            "RENT_VIEW"
          ]
        }
      ]
    }
  ]
}
```

The service calculating this response is the single place where module enablement, membership access, `FULL_ACCESS`, and custom permission rows are combined.

The frontend must not reproduce this database logic.

---

## 13.7 — Visibility rules

A module is visible when:

- it is enabled for the property/context, and
- the current membership has at least one applicable permission, unless the module explicitly has a view-level permission that defines visibility.

A feature is visible when the user has its view/read permission or an explicitly defined equivalent.

An action is available when the corresponding action permission exists.

Example:

```text
Aarav
  LEASE_VIEW       ✓
  LEASE_CREATE     ✓
  LEASE_UPDATE     ✓
  LEASE_DELETE     ✗
```

Result:

```text
Leases → visible
Create Lease → visible
Edit Lease → visible
Delete Lease → hidden/disabled according to the approved interaction pattern
```

Do not infer permissions merely because a user can see a parent module.

---

# PART 14 — FRONTEND ACCESS ARCHITECTURE

## 14.1 — Access loading

Landlord and Resident frontends should consume effective access through a dedicated access client/hook layer:

```text
GET /properties/{propertyId}/access
              ↓
        Access API client
              ↓
          useAccess()
              ↓
       effective access state
```

The access state must be scoped to the currently selected property where property context applies.

---

## 14.2 — Navigation becomes data-driven

The current landlord sidebar is hardcoded. Replace its visibility logic with a stable frontend navigation registry plus backend-derived access.

```text
Navigation registry
       +
Effective access
       ↓
Visible navigation
       ↓
Sidebar / mobile navigation
```

The frontend may continue to own:

- route paths
- component references
- labels
- icon references
- ordering metadata

The backend owns whether a module/feature is actually available to the current user/property.

This prevents the frontend from becoming coupled to membership/permission tables.

---

## 14.3 — Feature-level UI authorization

Introduce a single frontend permission primitive:

```tsx
<Can permission="LEASE_CREATE">
  <CreateLeaseButton />
</Can>
```

or:

```tsx
if (can("LEASE_CREATE")) {
  // render action
}
```

The helper must operate from the already-loaded effective access state rather than making a network request for every button.

---

## 14.4 — Backend remains authority

Hiding a button is UX, not authorization.

Every protected controller/service operation must continue to enforce authorization server-side.

```text
Frontend permission check
        ↓
       UX

Backend permission check
        ↓
     SECURITY
```

A malicious client must not gain access by manually invoking an API whose button was hidden in the UI.

---

# PART 15 — APPROVED LANDLORD DESIGN INVENTORY

The approved Figma design establishes the new visual and information architecture for the complete Landlord application.

### Auth + onboarding

- Mode selection
- Login
- Signup
- Onboarding

### Portfolio + property management

- Command Center / Portfolio
- Analytics
- Property creation
- Property editing
- Floor list overview
- Floor editor
- Unit detail

### Rental

- Lease list
- Lease detail/actions
- Rent roll
- Tenant-facing property/tenant operational views

### Finance

- Billing
- Billing worksheet
- Expenses
- Expense configuration
- Meter readings
- Financial ledger

### Inventory

- Inventory list
- Inventory item/detail states
- Tenant inventory

### Communication

- Announcements
- Escalations/issues

### Reporting

- Reports
- Report empty/loading/error states

### AI

- AI Desk / Assistant
- Prompt/chat states
- Usage/credit states where applicable

### Team + access

- Membership/team list
- Member access editor
- Module enablement
- Feature permission editor
- Effective navigation preview

### Settings

- Settings menu
- Settings screens

Every screen should use the canonical shell, property context, responsive rules, tokenized visual system, and feature-level access behavior defined above.

---

# PART 16 — APPROVED RESIDENT DESIGN INVENTORY

Resident is intentionally simpler than Landlord. The Resident navigation must expose only resident-relevant capabilities.

### Auth

- Login
- Signup
- Mode selection where applicable

### Home

- Tenant Home
- Property context

### Payments

- Rent/payment overview
- Payment history
- Payment action states

### Maintenance

- Maintenance list
- Create/request maintenance
- Maintenance detail/status

### Inventory

- Resident inventory
- Tenant inventory/detail states

### Communication

- Announcements/notices
- Read/unread states

### AI

- Resident AI Assistant where enabled

### Profile/settings

- Resident settings/profile

Resident navigation must never expose landlord-only modules merely because the same user identity can participate in a property membership elsewhere.

---

# PART 17 — DESIGN SYSTEM IMPLEMENTATION RULES

The approved Figma visual language is now the implementation target.

## Surfaces

- Flat surfaces only
- No glassmorphism
- Hairline borders
- Minimal/no default shadows
- Warm neutral page background
- White/light surface containers

## Color

Light direction:

```text
Primary   #0E4F52
Background #F7F6F3
Text      #12181B
Muted     #5B6668
Outline   #DEDCD5
```

Dark mode must use theme tokens rather than hardcoded literals.

## Typography

- Inter
- Sentence case
- No blanket all-caps UI
- No decorative letter-spacing hacks
- Typography tokens centralized in `Theme.ts`

## Actions

- Primary actions use solid primary color
- No decorative gradients
- Desktop primary actions belong in the page-header action row where applicable
- Secondary/outline actions use transparent surfaces with outline borders

## Data-dense screens

- Tables remain tables; do not convert every row into a card
- Left-align text
- Right-align numeric values
- Hairline dividers
- Real hover/focus states

## Responsive tiers

```text
<768px       Mobile
768–1024px   Tablet
>=1024px     Desktop
```

Mobile uses a compact navigation model and single-column layouts where appropriate. Tablet uses collapsible navigation and two-column layouts where content allows. Desktop uses persistent sidebar navigation and wider data layouts.

---

# PART 18 — IMPLEMENTATION ORDER AFTER DESIGN APPROVAL

The design approval changes the order of work: **do not redesign screens during implementation.** The Figma file is now the visual reference.

### Phase 1 — Backend access foundation

1. Inspect current permission seed data and permission usage on `main`.
2. Inspect current `PropertyModuleTbl` repository/service/controller and existing migrations.
3. Define stable module catalog.
4. Migrate `property_module_tbl` from string module identity to module identity.
5. Define feature/permission metadata without reintroducing roles.
6. Define management types and management-type/module defaults without modifying `property_tbl`.
7. Implement effective-access service.
8. Add `GET /api/properties/{propertyId}/access`.
9. Add backend authorization checks to protected operations where missing.

### Phase 2 — Frontend access foundation

1. Add access API client.
2. Add `useAccess()` state/query.
3. Connect property selection to access state.
4. Replace hardcoded sidebar visibility with navigation registry + access filtering.
5. Add `<Can>` / `can()` permission primitive.
6. Apply feature-level permission checks to action controls.
7. Add loading/empty/error access states.

### Phase 3 — Landlord implementation

Migrate the approved Figma screens feature-by-feature, beginning with Rental:

```text
Property context
    ↓
Rental
    ├── Leases
    ├── Tenants
    ├── Rent
    └── Rental dashboard/overview
```

Then Finance, Inventory, Communication, Reporting, AI, and Access.

### Phase 4 — Resident implementation

Implement the approved Resident screens using the same visual tokens and access principles but with a resident-specific information architecture.

### Phase 5 — Existing engineering cleanup

Continue the pre-existing quality backlog:

- CSS media-query mobile-nav fix
- Mobile property selector
- Triple-sidebar removal
- `rgba()` / `hsla()` sweep
- `fontWeight` sweep
- PageShell adoption
- screen decomposition
- pagination
- shared UI package extraction
- SQL migration guardrails

### Phase 6 — Verification

Every implemented screen must be checked for:

- Figma visual fidelity
- mobile/tablet/desktop behavior
- access visibility
- backend authorization
- loading/error/empty states
- accessibility
- design-token compliance
- route correctness
- property scoping

---

# PART 19 — SCALABILITY & INFRASTRUCTURE

These remain part of the master plan:

### 19.1 — Shared types package (`@livic/types`)

Frontend TypeScript interfaces matching backend DTOs are currently hand-written per feature. Generate from OpenAPI if available; otherwise centralize shared contracts so backend field changes have one controlled frontend update point.

### 19.2 — Import-boundary enforcement

Restrict cross-feature imports to each feature's public `index.ts` surface. Feature internals must not become accidental dependencies of other features.

### 19.3 — Error tracking

Add Sentry or equivalent before real production adoption so user-facing crashes and failed requests are observable.

### 19.4 — Living component catalog

Once stable primitives are extracted, add Storybook or an equivalent in-app component catalog for PageShell, property selector, navigation, permissions UI, tables, forms, status components, and other shared primitives.

### 19.5 — CI test-gating

Ensure quality/lint/typecheck/test/build failures actually block merges. PR review automation is not a replacement for CI gates.

---

# ARCHITECTURAL NON-NEGOTIABLES

The following decisions are locked unless a new product requirement explicitly changes them:

1. **No `membership_role_tbl`.**
2. **No management-type columns on `property_tbl`.**
3. **No arbitrary permission inheritance from UNIT to PROPERTY.**
4. **Membership and ownership are not the same conceptual concern.**
5. **Rental is implemented first.**
6. **Frontend visibility comes from effective access.**
7. **Backend authorization remains authoritative.**
8. **Figma is the approved visual reference; implementation should not invent parallel UI patterns.**
9. **Landlord and Resident remain independently implemented frontends, while following the same visual identity system.**
10. **The existing property-selection architecture remains the canonical property-context mechanism.**
11. **Breaking changes are acceptable while the product remains pre-production, but migrations must preserve existing data.**

---

## FINAL STATUS

**Design:** APPROVED

**Architecture direction:** APPROVED

**Implementation state:** NOT YET IMPLEMENTED

**Next engineering task:** inspect and finalize the current backend module/permission schema and migrations on `main`, then implement the access foundation before migrating screens to the approved Figma design.
