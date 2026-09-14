# Livic Marketplace Backend — Build Plan (`marketplace` module)

**Purpose of this document:** a self-contained, handoff-ready spec for building the public-facing
marketplace backend module in the existing Spring Boot monorepo. Written so another engineer/agent
can execute it without needing prior conversation history. Companion to
`livic-marketplace-fe-plan.md` (the Next.js frontend plan) — the two must agree on the API contract
in §6; discrepancies found while writing this doc are called out in §6.5.

Everything in this document was checked against the actual repository
(`github.com/ritikkatiyar/livic`, `backend/` — Spring Boot, Java, PostgreSQL, Flyway) rather than
assumed. Where I couldn't verify something from the repo, it's flagged in §11.

---

## 1. Context & Decisions Already Made

| Topic | Decision |
|---|---|
| Leads model | **One generic `marketplace_lead_tbl`** with a `leadType` discriminator (`TOUR_REQUEST`, `BOOKING`, extensible to future types) — not separate tables per interaction type |
| Pricing | `UnitTbl.basePrice` — single field, no tiered/seasonal pricing |
| Micro-site flow | One universal flow for all `PropertyType`s (RENTAL, HOSTEL, SOCIETY, MESS, INDIVIDUAL) — no per-type backend branching needed yet |
| Public listing | `PropertyTbl.isPubliclyListed` defaults to **true**; owner can opt out per property |
| QR codes | Property-level only, deep-links to the property micro-site |
| Token payment | Refundable, via existing Razorpay integration (`payment` module) — reused, not rebuilt |
| Booking conversion | A `CONVERTED` `BOOKING`-type lead should link to/spawn a row in the **existing** `unit_booking_tbl` (used by the staff/landlord-side lease flow) — the new marketplace module feeds into it rather than duplicating it |

---

## 2. What Already Exists (verified in repo — reuse, don't rebuild)

| Need | Existing asset | Location |
|---|---|---|
| Property/unit data | `PropertyTbl`, `UnitTbl` (has `PropertyType`, `UnitType` enums) | `com.livic.property.domain` |
| Staff-side booking w/ token amount | `UnitBookingTbl` — `tokenAmount` (BigDecimal), `prospectiveTenantName/Phone/Email`, `expectedMoveInDate`, `status` (BOOKED/CONVERTED/FORFEITED/REFUNDED) | `com.livic.finance.domain` |
| Payment gateway | `PaymentGatewayService` interface + `RazorpayPaymentGatewayServiceImpl`, `PaymentFacade`, webhook handling already wired | `com.livic.payment.*` |
| Photos/media | `MediaAssetTbl` — polymorphic (`ownerModule` enum: `PROPERTY`, `LEASE`, `INVENTORY`; `referenceId`) | `com.livic.storage.domain` |
| Notifications | `NotificationService` with channel senders already implemented: `EmailNotificationSender`, `WhatsAppNotificationSender`, `PushNotificationSender`, `ConsoleNotificationSender` (no SMS sender currently — see §5.4) | `com.livic.notification.*` |
| Response envelope | `ApiResponse<T>` — `{ success: boolean, data: T, error: String }` (a plain string, **not** an object with code/message) | `com.livic.common.response.ApiResponse` |
| Validation errors | `GlobalExceptionHandler` (`@RestControllerAdvice`) already handles `MethodArgumentNotValidException` → structured field errors | `com.livic.common.exception` |
| Auth/permissions | JWT via `JwtAuthenticationFilter`, `@PreAuthorize("@authorizationService.hasPermission(...)")` pattern on staff endpoints | `com.livic.auth.*`, `com.livic.config.SecurityConfig` |
| Migrations | Flyway, versioned SQL files in `src/main/resources/db/migration`, latest is `V8__create_storage_and_inventory_schema.sql` — **new migrations start at `V9`** | `db/migration/` |

**Package convention:** existing top-level modules are `analytics, announcement, auth, billing,
common, config, finance, inventory, issue, notification, payment, property, storage, user`. The new
module follows the same convention: `com.livic.marketplace.{domain,dto,repository,service,controller,mapper}`.

---

## 3. What's Genuinely Missing (build this)

1. **The entire `marketplace` package** — public, unauthenticated controllers/services (nothing like
   this exists yet; every current endpoint requires JWT auth per `SecurityConfig`).
2. **`marketplace_lead_tbl`** — new entity, per the generic-leads decision.
3. **OTP verification** — no OTP infrastructure exists anywhere in the codebase today. Build from
   scratch (§5.3).
4. **Rate limiting for public endpoints** — no rate-limiting library or Redis is present in the stack
   (confirmed: `pom.xml` has a comment `<!-- Redis removed: replaced by ai-service event flow -->`,
   and there's no Caffeine/other cache dependency either). This means OTP/lead-creation rate limiting
   needs a **DB-backed** approach for v1, not the in-memory or Redis-backed approach you'd default
   to — see §5.3. Flagging this clearly so nobody wastes time wiring up Redis that isn't there.
5. **New fields on `PropertyTbl`** — `isPubliclyListed`, `description`, `amenities`, `qrSlug`.
6. **New fields on `UnitTbl`** — `basePrice`, `isBookable` (or a computed equivalent — see §4.3).
7. **`SecurityConfig`** changes to permit the new public paths.
8. **QR code generation** — no QR library currently in `pom.xml`; need to add one (e.g. ZXing).

---

## 4. Database Changes (Flyway migration `V9__create_marketplace_schema.sql`)

### 4.1 `property_tbl` — new columns

```sql
ALTER TABLE property_tbl
    ADD COLUMN is_publicly_listed BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN description TEXT,
    ADD COLUMN amenities TEXT[],           -- simple string array for v1, per the "keep pricing/
                                            -- amenities simple" decisions already made for this phase
    ADD COLUMN qr_slug VARCHAR(64) UNIQUE; -- random slug, generated on first publish, used in the
                                            -- QR-code deep link instead of exposing the raw UUID
```

### 4.2 `unit_tbl` — new columns

```sql
ALTER TABLE unit_tbl
    ADD COLUMN base_price NUMERIC(12,2),
    ADD COLUMN is_bookable BOOLEAN NOT NULL DEFAULT FALSE; -- explicit flag, not purely derived —
        -- see §4.3 for why "derive from absence of active lease" alone isn't reliable enough for v1
```

### 4.3 Availability: explicit flag, not pure derivation

Earlier planning considered deriving `isBookable` purely from "no active lease on this unit." That's
insufficient on its own because it doesn't account for:
- units under maintenance/temporarily withdrawn from the market
- units with a future-dated lease that hasn't started yet but shouldn't show as bookable
- owner-controlled override (a unit might have no lease but the owner isn't ready to list it)

**Decision for this build:** `is_bookable` is an explicit, owner/staff-settable boolean column,
defaulting to `false`. A scheduled/triggered background sync (§9, explicitly out of scope for v1 —
document as a follow-up) can later auto-flip it based on lease status; for now, staff toggle it
manually via the existing property/unit management UI (a small addition to `livic-landlord-fe`, not
part of this backend module's v1 scope — flag as a dependency in §10).

### 4.4 `marketplace_lead_tbl` — new table

```sql
CREATE TABLE marketplace_lead_tbl (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id              UUID NOT NULL REFERENCES property_tbl(id),
    unit_id                  UUID NOT NULL REFERENCES unit_tbl(id),
    lead_type                VARCHAR(32) NOT NULL,   -- TOUR_REQUEST, BOOKING (extensible)
    status                   VARCHAR(32) NOT NULL DEFAULT 'NEW',
                                                       -- NEW, CONFIRMED, CONVERTED, CANCELLED, REFUNDED
    prospect_name             VARCHAR(255) NOT NULL,
    prospect_phone            VARCHAR(20) NOT NULL,
    prospect_email            VARCHAR(255),
    preferred_slot            TIMESTAMP,              -- TOUR_REQUEST only
    expected_move_in_date     DATE,                   -- BOOKING only
    token_amount              NUMERIC(12,2),
    payment_transaction_id    UUID REFERENCES payment_transaction_tbl(id),
    converted_unit_booking_id UUID REFERENCES unit_booking_tbl(id), -- set when a BOOKING lead
                                                                      -- converts into a staff-side
                                                                      -- unit_booking_tbl row
    source                    VARCHAR(32) DEFAULT 'MARKETPLACE',    -- extensibility hook: QR, SEARCH,
                                                                      -- DIRECT_LINK — not required for
                                                                      -- v1 logic, just don't lose the
                                                                      -- signal if it's easy to capture
    created_at                TIMESTAMP NOT NULL DEFAULT now(),
    updated_at                TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketplace_lead_property ON marketplace_lead_tbl(property_id);
CREATE INDEX idx_marketplace_lead_unit ON marketplace_lead_tbl(unit_id);
CREATE INDEX idx_marketplace_lead_phone ON marketplace_lead_tbl(prospect_phone);
CREATE INDEX idx_marketplace_lead_status ON marketplace_lead_tbl(status);
```

**No JSON payload column for type-specific fields.** The original architecture discussion considered
a JSON payload for type-specific fields to keep the table fully generic. In practice there are only
two lead types right now and both fit cleanly into named nullable columns (`preferred_slot` for
tours, `expected_move_in_date`/`token_amount` for bookings) — a JSON blob would trade real type
safety and queryability for speculative flexibility we don't need yet. If a third lead type needs
genuinely different shape (not just "another nullable column"), add a JSON `payload` column in a
later migration. Don't build it preemptively.

### 4.5 `otp_verification_tbl` — new table (no Redis/cache available, see §3.4)

```sql
CREATE TABLE otp_verification_tbl (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(20) NOT NULL,
    otp_code_hash   VARCHAR(255) NOT NULL,   -- hashed, never store raw OTP
    session_token   VARCHAR(255) UNIQUE,     -- issued only after successful verification
    attempts        INTEGER NOT NULL DEFAULT 0,
    expires_at      TIMESTAMP NOT NULL,
    verified_at     TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_otp_phone ON otp_verification_tbl(phone);
CREATE INDEX idx_otp_session_token ON otp_verification_tbl(session_token);
```

A scheduled cleanup job (Spring `@Scheduled`, matching the pattern likely already used elsewhere for
housekeeping — check for an existing `@Scheduled` job to mirror before adding a new one) purges
expired/unverified rows older than 24h.

---

## 5. Module Structure

```
backend/src/main/java/com/livic/marketplace/
  domain/
    MarketplaceLeadTbl.java
    OtpVerificationTbl.java
  common/
    domain/
      LeadType.java              # enum: TOUR_REQUEST, BOOKING
      LeadStatus.java            # enum: NEW, CONFIRMED, CONVERTED, CANCELLED, REFUNDED
                                  # (place in com.livic.common.domain alongside UnitBookingStatus,
                                  # UnitType etc. — matches existing convention of shared enums
                                  # living in common.domain, not duplicated per-module)
  dto/
    MarketplacePropertyDTOs.java     # PropertySummaryResponse, PropertyDetailResponse
    MarketplaceUnitDTOs.java         # UnitSummaryResponse
    MarketplaceLeadDTOs.java         # CreateLeadRequest, LeadResponse
    OtpDTOs.java                     # OtpRequestRequest, OtpVerifyRequest, OtpVerifyResponse
  repository/
    MarketplaceLeadRepository.java
    OtpVerificationRepository.java
  mapper/
    MarketplacePropertyMapper.java
    MarketplaceLeadMapper.java
  service/
    interfaces/
      MarketplaceSearchService.java
      MarketplaceLeadService.java
      OtpService.java
    impl/
      MarketplaceSearchServiceImpl.java
      MarketplaceLeadServiceImpl.java
      OtpServiceImpl.java
  controller/
    MarketplaceSearchController.java     # GET search, GET property detail, GET unit detail
    MarketplaceLeadController.java       # POST leads, GET lead status
    MarketplaceOtpController.java        # POST otp/request, POST otp/verify
  qr/
    QrCodeService.java                    # generates QR image bytes for a property's qrSlug
```

This mirrors the existing per-module layering seen in `finance` and `property`
(`domain → repository → service.interfaces/impl → mapper → controller`, plus DTOs as static nested
records in a `*DTOs` class, matching `UnitBookingDTOs.java` / `PropertyDTOs.java` conventions).

---

## 6. API Contract

### 6.1 Response envelope — **use the real shape, not the FE plan's assumption**

```java
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String error;   // plain string, not {code, message}
}
```

### 6.2 Endpoints

| Purpose | Method + Path | Auth | Notes |
|---|---|---|---|
| Search properties | `GET /api/v1/marketplace/properties?city=&minPrice=&maxPrice=&type=&availableFrom=` | Public | Only returns `isPubliclyListed = true` properties |
| Property detail | `GET /api/v1/marketplace/properties/{propertyId}` | Public | 404 if not found or unlisted |
| Unit detail | `GET /api/v1/marketplace/properties/{propertyId}/units/{unitId}` | Public | **Confirmed against actual FE code:** returns a composite `{ property: PropertySummaryResponse, unit: UnitSummaryResponse }`, not a bare unit object — the room detail page needs property context (name, address, city) for breadcrumbs and the "Back to {property.name}" link. 404 if `isBookable = false` and not just viewing (decide: still show non-bookable units read-only, or 404 — recommend **show read-only**, so a unit that just went unavailable doesn't break a shared link — **confirmed: FE already does this**, it renders the unit with a "Currently Occupied" badge rather than 404ing on `isBookable = false`) |
| Request OTP | `POST /api/v1/marketplace/otp/request` `{ phone }` | Public | Rate-limited (§7) |
| Verify OTP | `POST /api/v1/marketplace/otp/verify` `{ phone, code }` → `{ sessionToken, expiresAt }` | Public | Rate-limited (§7) |
| Create lead | `POST /api/v1/marketplace/properties/{propertyId}/units/{unitId}/leads` body: `CreateLeadRequest`, header: `X-Otp-Session-Token` | Public, OTP-gated | Validates session token server-side before insert |
| Get lead status | `GET /api/v1/marketplace/leads/{leadId}` | Public | For the frontend's post-payment polling |
| Initiate token payment | `POST /api/v1/marketplace/leads/{leadId}/token-payment/online` | Public | Delegates to existing `PaymentFacade`/`PaymentGatewayService` — see §6.4 |
| Property QR image | `GET /api/v1/marketplace/properties/{propertyId}/qr` | Public | Returns PNG, see §8 |

### 6.3 DTOs (Java records, matching existing style)

```java
public class MarketplaceLeadDTOs {

    public record CreateLeadRequest(
        @NotNull LeadType leadType,
        @NotBlank String prospectName,
        @NotBlank @Pattern(regexp = "^[0-9]{10}$") String prospectPhone,
        @Email String prospectEmail,
        Instant preferredSlot,           // required if leadType == TOUR_REQUEST — validate in service, not annotation (cross-field)
        LocalDate expectedMoveInDate     // required if leadType == BOOKING
    ) {}

    public record LeadResponse(
        UUID id,
        UUID propertyId,
        UUID unitId,
        LeadType leadType,
        LeadStatus status,
        BigDecimal tokenAmount,
        UUID paymentTransactionId,
        Instant createdAt
    ) {}
}
```

Cross-field validation (preferred_slot required only for tours, etc.) should live in the service
layer, not bolted onto the DTO with complex annotation combinations — matches how `UnitBookingDTOs`
keeps validation simple and pushes business rules into the service impl.

### 6.4 Token payment — reuse, don't reimplement

`MarketplaceLeadService.initiateTokenPayment(leadId)` should call the **existing**
`PaymentFacade`/`PaymentGatewayService` the same way `UnitBookingController`'s payment flow does —
check `PaymentFacadeImpl` for the exact method signature before wiring this up; don't write a new
Razorpay integration. The marketplace module's job is just to associate the resulting
`PaymentTransactionTbl` row with the `marketplace_lead_tbl` row via `payment_transaction_id`.

On `PaymentCompletedEvent` (already an existing Spring event, per `com.livic.payment.event`), add a
listener in the marketplace module — mirroring the pattern in
`com.livic.finance.event.RentPublishedNotificationListener` — that:
1. Marks the lead `CONFIRMED`
2. If `leadType == BOOKING`, creates the corresponding `unit_booking_tbl` row and sets
   `converted_unit_booking_id`
3. Triggers a notification (§6.5)

### 6.5 Discrepancy with the frontend plan — reconcile before building

The frontend plan (`livic-marketplace-fe-plan.md`, §5.1) assumed `error: { code: string; message:
string }`. The real `ApiResponse<T>.error` is a **plain string**. Whoever wires up the real API call
(replacing the FE's mock layer) needs to fix the FE's `ApiError` type to match. Flagging this now so
it isn't rediscovered mid-integration — it's a one-line type fix on the FE side, not a backend
change.

---

## 7. OTP & Rate Limiting (built from scratch — nothing to reuse here)

Since there's no Redis/cache layer in this codebase (confirmed in §3), implement rate limiting
against `otp_verification_tbl` directly:

- **OTP request:** before inserting a new OTP row, query `otp_verification_tbl` for rows with the
  same `phone` created in the last 60 seconds — if any exist, reject with a 429-equivalent
  `ApiResponse.error("Please wait before requesting another code")`. Also cap at **5 requests per
  phone per hour**.
- **OTP verify:** increment `attempts` on each failed check; lock out after **5 failed attempts** on
  a given OTP row (return a generic "invalid or expired code" — don't reveal attempt count to the
  caller, avoid helping enumeration).
- **OTP code:** 6 digits, generated via `SecureRandom`, hashed (e.g. BCrypt or SHA-256 with a pepper
  — match whatever the `auth` module already uses for password hashing, check
  `CustomUserDetailsService`/`PasswordEncoder` bean before picking a different hashing approach) and
  stored as `otp_code_hash`. **Never log the raw OTP** — check existing logging conventions (the
  codebase uses `@Slf4j` + structured `log.info`/`log.warn` calls liberally) and make sure no log
  statement in this module accidentally includes it.
- **Session token:** a random opaque string (e.g. `UUID.randomUUID()` twice concatenated, or a
  proper JWT if you want it self-verifying — a plain random string looked up in
  `otp_verification_tbl` is simpler and consistent with "no new infra" constraint), expires **15
  minutes** after verification. `MarketplaceLeadController` validates it server-side on every
  lead-creation call by looking up the row and checking `verified_at` is set and not expired.
- **Lead-creation rate limiting:** same DB-query approach — cap at, say, 10 leads per phone per day
  across the whole marketplace, to blunt spam without needing new infra. Tune this number with
  whoever owns growth/product, it's a placeholder.

**SMS delivery for OTP:** the `notification` module has Email, WhatsApp, Push, and Console senders —
**no SMS sender exists**. Either (a) add a new `SmsNotificationSender` implementing whatever
interface `NotificationChannelSender` defines (check that interface before implementing), or (b) send
the OTP via WhatsApp using the existing `WhatsAppNotificationSender` if that's an acceptable UX
substitute. This is a real open decision — flagged in §11, don't guess silently.

---

## 8. QR Code Generation

No QR library currently in `pom.xml`. Add **ZXing** (`com.google.zxing:core` +
`com.google.zxing:javase`), the standard Java QR library — lightweight, no new infra dependency
beyond the jar itself.

`QrCodeService.generatePng(String qrSlug)`:
1. Build the target URL: `{marketplaceBaseUrl}/market-place/{propertyId}` — resolve `propertyId`
   from `qrSlug` via `PropertyRepository`, or encode the slug directly in the frontend's route (either
   works; simplest is to just deep-link straight to `/market-place/{propertyId}` using the slug
   as an alias if the frontend route supports slug lookup — otherwise resolve slug → UUID server-side
   before generating).
2. Encode via ZXing `QRCodeWriter`, output as PNG bytes.
3. Serve via `MarketplaceSearchController`'s `GET /properties/{propertyId}/qr` endpoint with
   `Content-Type: image/png`. Cache-Control header of a day or so is reasonable — QR content for a
   given property rarely changes.

`qrSlug` is generated once, on the first `isPubliclyListed = true` transition (or on property
creation, simpler) — a random URL-safe string, not the raw property UUID, so the printed QR doesn't
leak internal IDs even though the property itself isn't sensitive data.

---

## 9. Explicitly Out of Scope for This Module (v1)

- Auto-syncing `is_bookable` from lease status (manual toggle for v1, per §4.3)
- Owner-facing UI to toggle `isPubliclyListed` / manage amenities / enter description — that's a
  `livic-landlord-fe` frontend task, not this backend module, though this module must expose the
  update endpoints for it to call (add `PATCH /api/v1/properties/{id}/marketplace-settings` as an
  **authenticated**, staff-only endpoint — outside the public `marketplace` module's own controllers,
  living in the existing `property` module instead, since it's an authenticated staff action)
- Marketplace search index / read-optimized projection (flagged as a future scalability item in
  earlier architecture discussion — direct queries against `property_tbl`/`unit_tbl` are fine at
  current scale, revisit if/when property count grows)
- QR scan analytics/tracking
- Property-type-aware backend logic (universal flow decision — see §1)
- Multi-currency support (assume INR, matches existing Razorpay integration's implicit assumption —
  confirm this assumption holds before expanding to other regions)

---

## 10. Dependencies on Other Work

- **`livic-landlord-fe` needs a small addition**: a toggle for `isPubliclyListed` and fields for
  `description`/`amenities`/`isBookable` on the property/unit edit screens, calling the
  `PATCH /marketplace-settings` endpoint mentioned in §9. Not part of this backend module's build,
  but this module is only useful once that exists — flag as a coordinated follow-up, not a blocker
  for building the backend module itself (properties can be manually flipped via direct DB/SQL for
  early testing before that UI exists).
- **`livic-marketplace-fe`** (companion plan) consumes everything in §6 — keep the two documents in
  sync if the contract changes during implementation.

---

## 11. Open Questions for Whoever Picks This Up

- **SMS vs WhatsApp for OTP delivery** (§7) — no SMS sender exists today; decide whether to build one
  or reuse WhatsApp
- **Password/OTP hashing algorithm** — confirm what `auth` module already uses (BCrypt via
  `PasswordEncoder` bean, most likely) and reuse the same approach for OTP hashing rather than
  introducing a second hashing scheme
- **Non-bookable unit detail page behavior** (§6.2) — recommend read-only display over 404, but
  confirm with product/frontend since it affects the FE's `not-found.tsx` behavior
- **`NotificationChannelSender` interface shape** — check its exact method signature before adding
  a new SMS implementation, to match the existing pattern precisely
- **Existing `@Scheduled` job conventions** — check how cleanup/housekeeping jobs are currently
  structured before adding the OTP-row cleanup job in §4.5, to match existing style (cron expression
  location, whether jobs live in a dedicated `scheduler` package, etc.)
- **Lead-creation and OTP rate-limit thresholds** (§7) are placeholders — confirm actual numbers with
  product before shipping, they're guesses based on reasonable anti-spam defaults, not requirements
- **Unit-level `description` and `amenities`** — **confirmed required, not speculative.** The actual
  FE code (`RoomCard.tsx` and the room detail page) actively renders `unit.description` and
  `unit.amenities` in two places. Add these as real columns on `unit_tbl` (mirroring §4.1's
  property-level approach — simple columns, no JSON payload needed for the same reasons given there).
- **Token amount must be authoritatively server-determined — confirmed as a real gap, not a risk.**
  The actual FE hardcodes `tokenAmount={2000}` as a constant passed into `CreateLeadRequest`,
  regardless of property/unit. The backend must **not** trust a client-supplied `tokenAmount` on lead
  creation — compute it server-side (fixed value, percentage of `basePrice`, or per-property owner
  config — that business rule doesn't exist yet and needs to be defined) and return the authoritative
  amount in `LeadResponse`. Treat any `tokenAmount` in the incoming `CreateLeadRequest` as ignorable,
  not authoritative, even once the FE is fixed to stop sending a hardcoded value.
- **`is_bookable` semantics vs. FE copy** — the actual FE shows "Currently Occupied" when
  `isBookable = false`, but §4.3 defines `is_bookable` more broadly (maintenance, owner not ready to
  list, no active lease yet, etc.), not just occupancy. Either narrow the flag's meaning to match the
  copy, or change the FE copy to something reason-agnostic like "Not Currently Available" — worth
  resolving before this reads as misleading to a renter who assumes the room is occupied by someone
  else specifically.
- **Whether `RoomConversionContainer` (the FE's booking/tour CTA component) gates on `isBookable`** —
  **confirmed it does not.** The booking form renders and functions identically regardless of
  `unit.isBookable`. This isn't purely a backend fix, but the backend should treat lead creation on a
  non-bookable unit as something to actively reject (or at minimum flag for staff review) rather than
  assuming the frontend will always prevent it — don't rely on client-side gating alone for something
  with real money attached.
- **OTP session token integrity — a real, code-confirmed FE bug worth knowing about even though it's
  not this module's code to fix.** The current FE fabricates its own session-token-shaped string
  client-side after OTP verification (`mock-otp-token-{phone}-{timestamp}`) instead of using the real
  token the OTP-verify endpoint would return. This is currently invisible under mock mode. Once this
  backend module is live, `otp_verification_tbl` lookups will correctly reject that fabricated string
  — which is the right behavior — but it means the FE booking/tour flow will hard-fail on first
  integration unless someone fixes the FE to thread through the real token first. Flagging so it's on
  someone's radar before integration day, not discovered as a surprise then.
