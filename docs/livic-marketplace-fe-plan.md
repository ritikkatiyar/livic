# Livic Marketplace Frontend — Build Plan (`livic-marketplace-fe`)

**Purpose of this document:** a self-contained, handoff-ready spec for building the public-facing
marketplace web app skeleton. Written so another engineer/agent can execute it without needing the
prior conversation history. Backend work (the `marketplace` module, `marketplace_lead_tbl`, etc.)
is **out of scope** for this doc — this covers the Next.js app only, built against a mocked API
layer that mirrors the agreed backend contract, so frontend work can proceed in parallel with backend.

---

## 1. Context & Decisions Already Made

This is a new app inside the existing `livic` monorepo (github.com/ritikkatiyar/livic), alongside
`livic-landlord-fe` and `livic-resident-fe` (both Expo/React Native apps). This new app is **web-only,
public, unauthenticated-by-default** — different enough from the existing apps that it gets its own
Next.js project rather than reusing the Expo codebase.

Locked decisions (do not re-litigate these):  

| Topic | Decision |
|---|---|
| Framework | Next.js (App Router), web-only |
| URL structure | `/market-place` (search), `/market-place/[propertyId]` (micro-site), `/market-place/[propertyId]/rooms/[unitId]` (room detail) |
| QR codes | Property-level only, deep-links to `/market-place/[propertyId]` |
| Leads model | Backend uses one generic `marketplace_lead_tbl` with a `leadType` discriminator (`TOUR_REQUEST`, `BOOKING`, extensible). Frontend should treat "tour" and "booking" as the same underlying request shape with a `leadType` field — **do not build two separate form/data models**. |
| Pricing | `Unit.basePrice` — a single numeric field. No tiered/seasonal pricing UI needed. |
| Micro-site flow | **One universal flow for all property types** (RENTAL, HOSTEL, SOCIETY, MESS, INDIVIDUAL) for now. Do not build per-property-type templates. Design the property page so a future property-type-aware flow could be swapped in later without a rewrite (see §7), but don't build that now. |
| Token payment | Refundable, via Razorpay (existing backend integration). Frontend just needs to launch Razorpay checkout and handle success/failure callback. |
| Public listing | Properties are public by default (`isPubliclyListed = true`); marketplace only ever shows properties where this is true — enforced server-side, frontend doesn't need to filter for it. |

---

## 2. Tech Stack

- **Next.js 14+ (App Router)**, TypeScript, React Server Components where sensible (property pages
  can be server-rendered for SEO; interactive booking/tour forms are client components).
- **Styling:** Tailwind CSS (matches the constraint set already used by `frontend-design` conventions
  in this environment; keeps it consistent if design system tokens are shared later).
- **Data fetching:** native `fetch` wrapped in a small typed API client (mirrors the pattern already
  used in `livic-landlord-fe/src/api/client.ts` — same `ApiResponse<T>` envelope, correlation ID
  header, timeout/retry — see §5).
- **Forms:** `react-hook-form` + `zod` for validation (tour request / booking forms, OTP forms).
- **State:** local component state + React Context for a lightweight "current search filters" and
  "OTP session" context. No heavy global state library needed for a v1 skeleton.
- **Payments:** Razorpay Checkout JS (loaded via script tag on the booking confirmation step only,
  not globally).
- **Package manager:** npm, consistent with the rest of the monorepo (`package-lock.json` present in
  sibling apps).

---

## 3. Repo Placement & Bootstrap

New top-level folder in the monorepo, sibling to the existing apps:

```
livic/
  backend/
  livic-landlord-fe/
  livic-resident-fe/
  livic-marketplace-fe/      <-- new
  docs/
```

Bootstrap steps:
1. `npx create-next-app@latest livic-marketplace-fe --typescript --tailwind --app --src-dir --import-alias "@/*"`
2. Add `.env.example` at the app root (see §6 for required vars) — mirror the root-level
   `.env.example` pattern already used in the monorepo.
3. Add a `README.md` documenting: how to run locally, env vars, folder structure, how it talks to
   the backend (or the mock API during initial development).
4. Confirm root `docker-compose.yml` / `dev.ps1` — check if they need a new service entry for this
   app once it exists (flag this as a follow-up task for whoever owns those files; don't block on it).

---

## 4. Folder Structure

Follow the same feature-based convention already used in `livic-landlord-fe/src/features/*`, adapted
for Next.js App Router:

```
livic-marketplace-fe/
  app/
    layout.tsx                        # root layout, fonts, global providers
    page.tsx                          # redirects to /market-place
    market-place/
      page.tsx                        # search/browse page (Section 8.1)
      layout.tsx                      # marketplace-specific chrome (header/footer)
      [propertyId]/
        page.tsx                      # property micro-site (Section 8.2)
        loading.tsx
        not-found.tsx                 # unpublished/unknown property
        rooms/
          [unitId]/
            page.tsx                  # room detail + book/tour CTA (Section 8.3)
    globals.css
  src/
    api/
      client.ts                       # typed fetch wrapper (Section 5)
      marketplace.ts                  # marketplace-specific API calls
      mock/                           # mock handlers used until backend is ready
        properties.mock.ts
        leads.mock.ts
    components/
      search/
        SearchFilters.tsx
        PropertyCard.tsx
        PropertyGrid.tsx
      property/
        PropertyGallery.tsx
        PropertyAmenities.tsx
        PropertyMap.tsx
        RoomList.tsx
        RoomCard.tsx
      booking/
        LeadActionPicker.tsx          # "Book now" vs "Request a tour"
        TourRequestForm.tsx
        BookingForm.tsx
        OtpVerifyModal.tsx
        TokenPaymentButton.tsx
        LeadConfirmation.tsx
      layout/
        MarketplaceHeader.tsx
        MarketplaceFooter.tsx
      ui/                             # generic buttons, inputs, skeletons, toasts
    features/
      search/
        useSearchFilters.ts
        useSearchResults.ts
      property/
        usePropertyDetail.ts
        useRoomAvailability.ts        # NOT for initial page load (that data comes with the property
                                       # payload, see §8.2). Only for a live re-check immediately
                                       # before payment in §8.3 Step 4b, in case availability changed
                                       # since the page loaded.
      leads/
        useCreateLead.ts               # unified hook for BOOKING and TOUR_REQUEST
        useOtpVerification.ts
        useTokenPayment.ts
    types/
      property.ts
      unit.ts
      lead.ts
      api.ts                          # shared ApiResponse<T> envelope type
    config/
      api.ts                          # apiUrl() helper, base URL from env
      razorpay.ts
    utils/
      formatCurrency.ts
      formatDate.ts
      errors.ts
      logger.ts
  public/
    ...
```

---

## 5. API Contract (Frontend's View)

Backend module is `marketplace` (see prior planning docs) — not yet built. **Build the frontend
against this contract using a mock layer** (`src/api/mock/`) so frontend work isn't blocked on
backend delivery. Swap the mock for real `fetch` calls behind the same function signatures once the
backend module ships — no component code should need to change.

### 5.1 Shared response envelope

Mirror the existing convention from `livic-landlord-fe/src/types/api.ts`:

```ts
export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error?: { code: string; message: string };
  correlationId?: string;
};
```

### 5.2 Types (derived from actual backend DTOs already in the repo)

```ts
// src/types/property.ts
export type PropertyType = 'RENTAL' | 'HOSTEL' | 'SOCIETY' | 'MESS' | 'INDIVIDUAL';

export type PropertySummary = {
  id: string;
  name: string;
  city: string;
  landmark?: string;
  propertyType: PropertyType;
  coverImageUrl?: string;
  startingPrice?: number;   // min basePrice across bookable units
};

export type PropertyDetail = PropertySummary & {
  address: string;
  totalFloors: number;
  description?: string;
  amenities: string[];
  images: string[];
  units: UnitSummary[];
};

// src/types/unit.ts
// VERIFIED against backend UnitType.java: the enum has a @JsonValue annotation, so the API
// serializes the DISPLAY NAME string, not the Java constant name. Match against these exact
// strings, not 'SINGLE_UNIT' etc.
export type UnitType = 'Single Unit' | 'Shared Unit' | '1 BHK' | '2 BHK' | 'Studio Apartment';

export type UnitSummary = {
  id: string;
  unitNumber: string;
  type: UnitType;
  capacity: number;
  basePrice: number;        // BigDecimal on the wire → arrives as a JSON number. DISPLAY-ONLY:
                             // never do arithmetic on this client-side (sums, discounts, etc.) —
                             // always format through utils/formatCurrency.ts and treat as opaque
                             // beyond direct display. Any derived calculation belongs server-side.
  isBookable: boolean;      // derived server-side; frontend just reads it
};

// src/types/lead.ts
export type LeadType = 'TOUR_REQUEST' | 'BOOKING';
export type LeadStatus = 'NEW' | 'CONFIRMED' | 'CONVERTED' | 'CANCELLED' | 'REFUNDED';

export type CreateLeadRequest = {
  leadType: LeadType;
  prospectName: string;
  prospectPhone: string;
  prospectEmail?: string;
  preferredSlot?: string;     // ISO datetime, only for TOUR_REQUEST
  expectedMoveInDate?: string; // ISO date, only for BOOKING
  tokenAmount?: number;        // only for BOOKING (and optionally paid tours) — display-only, see note above
};

export type LeadResponse = {
  id: string;
  propertyId: string;
  unitId: string;
  leadType: LeadType;
  status: LeadStatus;
  tokenAmount?: number;
  paymentTransactionId?: string;
  createdAt: string;
};
```

### 5.3 Endpoints frontend needs to call

| Purpose | Method + Path | Notes |
|---|---|---|
| Search properties | `GET /api/v1/marketplace/properties?city=&minPrice=&maxPrice=&type=&availableFrom=` | Public, no auth |
| Property detail | `GET /api/v1/marketplace/properties/{propertyId}` | Public. 404 if not found or `isPubliclyListed=false` |
| Room/unit detail | `GET /api/v1/marketplace/properties/{propertyId}/units/{unitId}` | Public |
| Request OTP | `POST /api/v1/marketplace/otp/request` `{ phone }` | Public, rate-limited server-side |
| Verify OTP | `POST /api/v1/marketplace/otp/verify` `{ phone, code }` → returns short-lived `otpSessionToken` | Public |
| Create lead (tour or booking) | `POST /api/v1/marketplace/properties/{propertyId}/units/{unitId}/leads` body: `CreateLeadRequest` + `otpSessionToken` header | Public, OTP-gated |
| Initiate token payment | `POST /api/v1/marketplace/leads/{leadId}/token-payment/online` → returns Razorpay order payload | Public |
| Confirm payment (webhook-driven; frontend just polls or listens for redirect) | `GET /api/v1/marketplace/leads/{leadId}` | Public, to poll status after Razorpay checkout closes |

**Note for backend integration:** these paths are the frontend's best-guess contract based on the
agreed architecture. Confirm exact paths/payloads with whoever builds the `marketplace` backend
module before removing the mock layer — treat `src/api/marketplace.ts` as the single seam to update.

**Note on polling (§8.3 Step 4b):** poll `GET /leads/{leadId}` every **2 seconds**, up to **5 attempts
(10s total)**. If still not `CONFIRMED` after that, stop polling and show "Payment received — we'll
confirm your booking shortly" instead of spinning indefinitely. Don't retry forever on a webhook race.

### 5.4 Mock layer must be isomorphic

`/market-place` and `/market-place/[propertyId]` are **server components** (§8.1, §8.2), so
`src/api/mock/*.ts` must run correctly in both the Node/RSC environment and the browser — no
`window`/`localStorage`/browser-only APIs inside the mock handlers. Use in-memory fixture arrays
plus `setTimeout`-based fake latency only; nothing that assumes a DOM.

### 5.5 Typed client (`src/api/client.ts`)

Port the pattern from `livic-landlord-fe/src/api/client.ts`: `apiRequest<T>(path, options)`
wrapping `fetch`, adding:
- `Content-Type: application/json`
- `X-Correlation-Id` (random UUID per request, for tracing)
- Configurable timeout (default 15s) via `AbortController`
- No `Authorization` header by default (marketplace is public) — but accept an optional
  `otpSessionToken` header for the lead-creation/payment endpoints specifically.
- Parse `ApiResponse<T>` envelope; throw a typed `ApiError` on `success: false`.

---

## 6. Environment Variables

`.env.example`:

```
NEXT_PUBLIC_API_BASE_URL=https://api.livic.app/api/v1
NEXT_PUBLIC_MARKETPLACE_BASE_URL=https://livic.app/market-place
NEXT_PUBLIC_RAZORPAY_KEY_ID=
NEXT_PUBLIC_USE_MOCK_API=true    # flip to false once backend marketplace module is live
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=  # for property location display, optional for v1
```

---

## 7. Design Principle: Keep the Universal Flow Swappable

Per the locked decision, build **one flow** for all property types now — but don't hardcode assumptions
that make a later per-type flow expensive to introduce. Concretely:

- Put the "what actions are available on this property" logic (e.g. "Book Now" + "Request Tour") behind
  a single function `getAvailableActions(property: PropertyDetail): LeadType[]` rather than scattering
  `if (type === 'RENTAL')` checks across components. Today it always returns `['TOUR_REQUEST', 'BOOKING']`
  regardless of `propertyType` — but it's one place to change later if MESS/SOCIETY need different actions.
- Keep `RoomList` / room-selection UI as a component that's conditionally rendered based on whether
  `property.units.length > 0`, not hardcoded into the page — so a future property type with no rooms
  (e.g. MESS) degrades gracefully instead of breaking.

Do not build a flow-config system now. This is just "don't paint yourself into a corner," not a v1 feature.

---

## 8. Pages — Detailed Spec

### 8.1 `/market-place` — Search & Browse

**Server component** for initial render (SEO-friendly), with a client-side filter bar that
re-fetches via the API route.

Elements:
- Search bar: city/locality text input
- Filters: price range (min/max), property type (multi-select chip), move-in date
- Results grid: `PropertyCard` — cover image, name, city/landmark, starting price, property type badge
- Pagination: a "Load more" button for v1 (manual, not auto-scroll-triggered) — simpler to implement
  and test than true infinite scroll; revisit if analytics later show it's a friction point
- Empty state: no results found for filters
- Loading state: skeleton grid (6 placeholder cards)

Acceptance criteria:
- [ ] Typing a city and pressing enter (or clicking Search) updates the URL query params and refetches
- [ ] Filters are reflected in the URL (shareable/bookmarkable search links)
- [ ] Property card click navigates to `/market-place/[propertyId]`
- [ ] Page renders usable content even with JS disabled (server-rendered initial results)

### 8.2 `/market-place/[propertyId]` — Property Micro-site

**Server component** for the main content (fetch property detail server-side for SEO + fast paint),
client components for interactive bits.

Elements, top to bottom:
1. **Gallery** — image carousel (hero image + thumbnails), reuses `MediaAssetTbl`-backed URLs from
   the backend, no upload logic needed here (read-only)
2. **Header block** — property name, type badge, address/landmark, "Get Directions" link (opens maps)
3. **Description** — plain text/markdown from `PropertyDetail.description`
4. **Amenities** — icon + label grid, from `PropertyDetail.amenities` (string list for v1 — don't
   build the generic attribute-table UI yet, just render whatever list the API returns)
5. **Available rooms** (`RoomList`) — card per unit: type, capacity, base price, "View & Book" button
   → links to `/market-place/[propertyId]/rooms/[unitId]`
6. **QR code section** (small, low-priority) — a "Share this property" block showing the QR code
   for this property page, with a copy-link button. Backend serves the QR image; if that's not ready
   yet, generate client-side from the current URL using a lightweight QR library (`qrcode.react`) as
   a placeholder — swap for backend-served QR when available.

States: loading skeleton, `not-found.tsx` for 404/unpublished property.

Acceptance criteria:
- [ ] Page is reachable by scanning a QR that deep-links straight here (i.e., works as a cold-start
      URL with no prior navigation — no client-only state required to render)
- [ ] All images have alt text
- [ ] Room cards show live-looking availability (`isBookable`) without extra client fetch (comes with
      the initial property payload)

### 8.3 `/market-place/[propertyId]/rooms/[unitId]` — Room Detail + Book/Tour

This is the highest-complexity page — the core conversion flow.

**Step 1 — Room detail** (server component)
- Room type, capacity, base price, any room-specific photos
- `LeadActionPicker`: two buttons — "Request a Tour" and "Book Now" (both call `getAvailableActions`
  from §7, not hardcoded)

**Step 2 — Form (client component, `TourRequestForm` or `BookingForm`)**
Shared field set (both are "leads" per the unified model):
- Name (required)
- Phone (required, used for OTP)
- Email (optional)
- If `leadType === 'TOUR_REQUEST'`: preferred date/time slot picker
- If `leadType === 'BOOKING'`: expected move-in date, token amount (display-only, server-determined)

**Step 3 — OTP verification (`OtpVerifyModal`)**
- On form submit, call "request OTP" with the phone number
- Show a 6-digit code input modal
- On verify, receive `otpSessionToken`, keep in memory (React state/context) — **do not persist to
  localStorage** (matches this environment's constraint against browser storage in artifacts, and
  is also just better practice for a short-lived token)
- Resend-code affordance with a basic cooldown timer (client-side only, 30s)

**Step 4a — Tour request confirmation**
- Call create-lead with `leadType: 'TOUR_REQUEST'` + `otpSessionToken`
- Show `LeadConfirmation`: "Tour requested — the property manager will confirm your slot" +
  reference ID

**Step 4b — Booking → token payment**
- Call create-lead with `leadType: 'BOOKING'` + `otpSessionToken` → returns `LeadResponse` with
  `id` and `tokenAmount`
- `TokenPaymentButton` calls "initiate token payment" → gets Razorpay order payload → opens Razorpay
  Checkout
- On Razorpay success callback, poll `GET /leads/{leadId}` per the polling rule in §5.3 (2s interval,
  5 attempts max) — don't block the UI indefinitely on a webhook race condition
- Show `LeadConfirmation` with token amount paid, refundable note, reference ID

Acceptance criteria:
- [ ] Form validation (zod) blocks submission on missing/invalid phone, name
- [ ] OTP modal handles wrong-code and expired-code error states distinctly
- [ ] Booking flow clearly displays "this token amount is refundable" copy before payment
- [ ] Payment failure (Razorpay dismissed/failed) leaves the lead in a retryable state, not stuck
- [ ] Entire flow works on mobile viewport widths (this is a QR-code-scanned, phone-first flow —
      test at 375px width minimum)

---

## 9. Testing, SEO, Accessibility, Tooling (don't skip these)

**Testing:** mirror `livic-landlord-fe`'s existing `__tests__/` convention, organized by feature:
```
__tests__/
  search/        # filter param parsing, PropertyCard rendering
  property/      # property page renders amenities/rooms correctly, not-found on 404
  leads/         # form validation, OTP flow state machine, mock lead creation
```
Use the mock API layer (§5.4) as the test fixture source — same data both places, no duplication.

**SEO essentials** (public marketplace pages should be indexable):
- `app/sitemap.ts` — dynamically list published property URLs
- `app/robots.ts`
- Per-page `generateMetadata()` on the property and room routes (title = property name, description
  = truncated property description, OG image = cover photo) — not just a static root `<title>`

**Accessibility, beyond general alt-text:**
- `OtpVerifyModal` needs a focus trap, closes on `Escape`, returns focus to the triggering button on
  close, and every input has an associated `<label>` (not just placeholder text)
- All interactive cards (`PropertyCard`, `RoomCard`) must be reachable and activatable via keyboard,
  not just click handlers on a `<div>`

**Error boundaries:** add `error.tsx` at the `[unitId]` route level too (currently only specified for
`[propertyId]` in §4) — an unknown or non-bookable unit ID should show a clear message, not crash.

**Tooling parity with sibling apps:**
- `eslint.config.js` (copy/adapt from `livic-landlord-fe`)
- `vercel.json` if this app deploys the same way as `livic-landlord-fe` — confirm with whoever owns
  deployment before assuming, but add it as a bootstrap checklist item either way

---

## 10. Explicitly Out of Scope for This Skeleton

Call these out clearly to whoever picks this up, so scope doesn't creep:

- Renter accounts / saved searches / login (marketplace is anonymous-only for v1)
- Reviews/ratings
- Property-type-aware flow variants (§7 — deferred by decision)
- Tiered/seasonal pricing display (§ pricing decision — single `basePrice` only)
- Admin/property-manager dashboard (separate app/module)
- Server-side QR generation (client-side placeholder acceptable per §8.2 until backend serves it)
- i18n / multi-language
- Analytics/QR-scan tracking (flagged as future work in the architecture mind map)

---

## 11. Suggested Build Order (for the executing agent)

Testing (§9), SEO essentials (§9), and accessibility (§9) are not a separate final phase — build
them alongside each step below, not bolted on at the end. Step 9 is a *pass/audit*, not the first
time these get touched.

1. Bootstrap app + folder structure (§3–4), including `eslint.config.js` and other tooling parity items (§9)
2. Types + mock API layer (§5) — get realistic fake data flowing before any UI
3. `/market-place` search page against mocks, with its `__tests__/search/` tests and `generateMetadata` (§9)
4. `/market-place/[propertyId]` micro-site against mocks, with `__tests__/property/` tests, `not-found.tsx`,
   and `generateMetadata` (§9)
5. Room detail page, static (no form yet), with its own `error.tsx`/`not-found.tsx` (§9)
6. Lead creation form + OTP modal (mocked OTP always succeeds with code `000000` in mock mode),
   built with the focus-trap/keyboard requirements from §9 from the start, plus `__tests__/leads/`
7. Token payment button — stub Razorpay in mock mode (auto-succeed after a fake delay) so the full
   flow is clickable end-to-end without real payment credentials
8. Wire real API base URL behind `NEXT_PUBLIC_USE_MOCK_API` flag once backend `marketplace` module
   endpoints exist; confirm contract against §5.3 and adjust `src/api/marketplace.ts` only
9. Full mobile-viewport pass + accessibility audit + `sitemap.ts`/`robots.ts` (§9) — a final check,
   not first implementation
10. README + handoff notes for backend integration

---

## 12. Open Questions for Whoever Picks This Up

- Whether OTP is SMS-only or also supports WhatsApp (affects copy on the OTP modal)
- Final Razorpay key management (test vs prod key injection per environment)
- Whether the QR image comes from the backend (`PropertyTbl.qrSlug` → rendered QR) or should remain
  client-generated long-term
- Whether this app deploys via Vercel like `livic-landlord-fe` (confirm before adding `vercel.json`)
- `startingPrice` on `PropertySummary` (§5.2) is marked optional — confirm whether the search
  endpoint computes it server-side (min `basePrice` across bookable units) or whether the frontend
  needs to compute it from a fuller payload
