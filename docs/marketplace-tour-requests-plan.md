# Marketplace Tour Requests â€” Landlord Approval & Prospect Tracking (Plan)

## 1. Goal

A prospect can already request a tour from the public marketplace (OTP-verified phone, no login). Next:

1. The **landlord** sees each request (name, mobile, email, unit, slot) and **approves or rejects** it (optional note).
2. The **prospect** learns the outcome **without an account**.
3. The same phone **cannot hold two active tour requests at the same property**.
4. The prospect can **cancel** their own request before the visit.

### Decisions (confirmed)

| Topic | Decision |
|---|---|
| Prospect status view | "My Requests" page: re-verify phone with OTP â†’ see all requests. Plus SMS/WhatsApp (and email if given) when the landlord decides. |
| Duplicate rule | One **active** tour per **phone + property** (any unit). Active = `PENDING` or `APPROVED` with a future visit slot. Allowed again after reject, cancel, or once the visit time passes. |
| Landlord actions | Approve, or Reject with an optional note shown to the prospect. No rescheduling in v1. |
| Prospect cancel | Allowed while `PENDING`/`APPROVED` and before the visit time. |
| Scope | Tour requests only. The BOOKING (token payment) flow is unchanged. |

---

## 2. Lifecycle

```
                 landlord approves            visit time passes
   PENDING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶ APPROVED â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶ COMPLETED
      â”‚  â”‚                               â”‚
      â”‚  â””â”€ landlord rejects â”€â–¶ REJECTED â”‚
      â”‚                                  â”‚
      â”œâ”€ prospect cancels â”€â–¶ CANCELLED â—€â”€â”˜ prospect cancels (before visit)
      â”‚
      â””â”€ visit time passes, no decision â”€â–¶ EXPIRED
```

- Terminal states: `REJECTED`, `CANCELLED`, `COMPLETED`, `EXPIRED`.
- "Active" (blocks duplicates, can be cancelled/decided): `PENDING`, `APPROVED` with `preferred_slot > now`.
- Landlord can decide only `PENDING` requests whose slot is still in the future.
- `LeadStatus` gains `APPROVED`, `REJECTED`, `COMPLETED`, `EXPIRED`. Existing `NEW` keeps meaning *pending* (shown as "Pending approval"); `CONFIRMED`/`CONVERTED`/`REFUNDED` stay for bookings. `status` is already `VARCHAR(32)`, so no enum migration.

---

## 3. End-to-end flow

### Prospect (no login)
1. Room page â†’ **Request a Tour** â†’ OTP â†’ lead created as `PENDING`.
2. If an active request already exists for this phone at this property, the API returns **409** with that request's summary. The UI shows *"You already have a pending/approved visit at this property on {date, time}"* and links to **My Requests** instead of creating another one.
3. Confirmation screen says **"Request sent â€” awaiting landlord approval"**, with **Track this request**.
4. Landlord decides â†’ prospect gets SMS/WhatsApp (and email if provided): *"Your visit to {property}, Unit {n} on {date time} was approved / declined: {note}. Track: {baseUrl}/market-place/my-requests"*.
5. **My Requests** (`/market-place/my-requests`): enter phone â†’ OTP (reuses `useOtpVerification` + `OtpVerifyModal`) â†’ cards for every tour request on that phone: property, unit, slot, status pill, landlord note, **Cancel** for active ones.
6. The verified session token (15-min lifetime, existing) is kept in `sessionStorage`, so going from the room page to My Requests right after verifying needs no second OTP. When it expires, the page asks for OTP again.

### Landlord (logged in)
1. New request â†’ push/WhatsApp to the property owner (per their notification preferences): *"New tour request â€” Unit 105, Tue 15 Sep 4:00 PM"*.
2. **Leases & Bookings** screen â†’ new **Tour Requests** tab for the selected property, with a pending-count badge. Filters: Pending Â· Upcoming (approved) Â· Past (rejected/cancelled/completed/expired).
3. Card: prospect name, mobile (tap to call), email (mailto), unit, visit slot, requested-at, status.
4. **Approve** â†’ toast, card moves to Upcoming. **Reject** â†’ modal with an optional note (â‰¤ 500 chars) â†’ card moves to Past.
5. If the prospect cancelled first or another staff member already decided, the API returns **409**. The UI refreshes the list and shows *"This request was already {status}"*.

---

## 4. Backend (Spring, `features.marketplace`)

### 4.1 Migration `V21__tour_request_lifecycle.sql`
- `marketplace_lead_tbl` add:
  - `decision_note VARCHAR(500) NULL`, `decided_by_user_id VARCHAR(36) NULL`, `decided_at DATETIME(6) NULL`, `cancelled_at DATETIME(6) NULL`
  - `version BIGINT NOT NULL DEFAULT 0` (optimistic locking for approve vs cancel races)
  - **DB-enforced duplicate rule**: generated column
    `active_tour_key VARCHAR(80) GENERATED ALWAYS AS (CASE WHEN lead_type='TOUR_REQUEST' AND status IN ('NEW','APPROVED') THEN CONCAT(property_id, ':', prospect_phone) END) STORED`
    with `UNIQUE KEY uq_active_tour (active_tour_key)` (NULLs don't collide). This makes two simultaneous submissions safe, not just the service check.
  - Index `(property_id, lead_type, status, preferred_slot)` for the landlord list; the existing phone index serves My Requests.
- Check whether `notification_log_tbl.recipient_id` allows NULL (needed for address-only sends); relax it in the same migration if not.

### 4.2 Domain & rules
- `MarketplaceLeadTbl`: new fields + `@Version`; methods `approve(userId)`, `reject(userId, note)`, `cancelByProspect()`, each validating the allowed transitions and future slot (throw `BusinessException` 409 otherwise).
- **Create** (`MarketplaceLeadServiceImpl.createLead`, tour branch):
  1. In the same transaction, close stale rows for this phone+property: `NEW â†’ EXPIRED` and `APPROVED â†’ COMPLETED` where `preferred_slot <= now`, so a past visit never blocks a new request.
  2. Look for an active row â†’ 409 `"You already have an active tour request at this property"` including `{leadId, status, preferredSlot, unitNumber}`.
  3. Insert; map a `DataIntegrityViolationException` on `uq_active_tour` to the same 409 (race).
- **Lifecycle job** `TourRequestLifecycleJob` (`@Scheduled`, every 15 min, like `AutoBillingJob`): bulk `NEWâ†’EXPIRED` and `APPROVEDâ†’COMPLETED` for past slots.

### 4.3 Prospect APIs (public, require `X-Otp-Session-Token`; phone taken from the verified session, never from the request)
| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/marketplace/my/tour-requests?page=&size=` | All tour requests for the session phone, newest first. Returns property name/address, unit number, slot, status, decision note, createdAt. |
| `POST` | `/api/v1/marketplace/my/tour-requests/{leadId}/cancel` | Lead phone must match session phone (else 404). Active + future only (else 409). |

- `OtpService` gains `resolveVerifiedPhone(sessionToken)` (the existing validation, returning the phone).
- **Privacy fix:** today `GET /api/v1/marketplace/leads/{leadId}` is public and returns the prospect's name, phone and email to anyone with the ID. Require the session token (phone must match), or return only `{id, status, leadType}` without it.
- Add `/api/v1/marketplace/my/**` to the public matchers only if they aren't already covered by `/api/v1/marketplace/**` (they are).

### 4.4 Landlord APIs (JWT)
| Method | Path | Authorization |
|---|---|---|
| `GET` | `/api/v1/properties/{propertyId}/tour-requests?filter=PENDING\|UPCOMING\|PAST&page=&size=` | `@PreAuthorize hasPermission(#propertyId, 'LEASE_VIEW')` |
| `GET` | `/api/v1/properties/{propertyId}/tour-requests/summary` | same; returns `{pending, upcoming}` for the tab badge |
| `POST` | `/api/v1/tour-requests/{leadId}/approve` | load lead â†’ `authorizationService.hasPermission(lead.propertyId, 'LEASE_UPDATE')` |
| `POST` | `/api/v1/tour-requests/{leadId}/reject` body `{note?}` | same |

- Response DTO: `id, unitId, unitNumber, prospectName, prospectPhone, prospectEmail, preferredSlot, status, decisionNote, decidedAt, createdAt`. Unit numbers are bulk-loaded via `UnitFacade.getUnitsByIds` (no N+1).
- New `TourRequestManagementController` + `TourRequestService` in `features.marketplace`. It depends only on `platform.auth` `AuthorizationService`/`AuthFacade`, `services.property` facades and `platform.notification`, so `ModuleBoundaryTest` stays green.
- `ObjectOptimisticLockingFailureException` â†’ 409 "already updated".

### 4.5 Notifications
- `NotificationService.sendToAddress(NotificationChannel, String address, String title, String body)` for recipients who aren't users (no user lookup or preference check; the log stores the channel with the address masked to its last 4 digits).
- Events, published inside the transaction and handled with `@TransactionalEventListener(AFTER_COMMIT)` + `@Async`, so a failed SMS never rolls back a decision:
  - `TourRequestCreatedEvent` â†’ owner via `AuthFacade.findPropertyOwnerId` â†’ `NotificationService.send(ownerId, PUSH/WHATSAPP, â€¦)`.
  - `TourRequestDecidedEvent` â†’ prospect: SMS (MSG91 when `msg91.sms.enabled`), else WhatsApp, else console sender in dev; plus EMAIL if `prospectEmail` is set.
  - `TourRequestCancelledEvent` â†’ owner (optional in v1).

---

## 5. Marketplace frontend (`livic-marketplace-fe`)

| Area | Change |
|---|---|
| `src/api/marketplace.ts` + adapters | `getMyTourRequests(token, page)`, `cancelMyTourRequest(token, id)`; `createLead` surfaces 409 with the existing request summary. |
| `src/types/lead.ts` | `LeadStatus` adds `APPROVED`, `REJECTED`, `COMPLETED`, `EXPIRED`; `MyTourRequest` type. |
| `useOtpVerification` | Persist `{token, phone, verifiedAt}` in `sessionStorage` (15-min TTL). Expose `restoreSession()`. |
| `RoomConversionContainer` / `TourRequestForm` | On 409: inline "already requested" card with slot, status and **View my requests** link. |
| `LeadConfirmation` | Tour copy becomes "Awaiting landlord approval" + **Track this request** link. |
| New route `app/market-place/my-requests/page.tsx` | Phone entry â†’ OTP â†’ list of `TourRequestCard`s (status pill colors: pending amber, approved emerald, rejected rose, cancelled/expired slate, completed indigo), landlord note, **Cancel** (confirm dialog) for active future ones. Empty state + "Explore properties". |
| `MarketplaceHeader` | "My Requests" link. |

---

## 6. Landlord frontend (`livic-landlord-fe`)

| Area | Change |
|---|---|
| `src/features/leases/api/tourRequest.api.ts` | list, summary, approve, reject (same `apiRequest` pattern as `unitBooking.api.ts`). |
| `src/features/leases/hooks/useTourRequests.ts` | Loads for `selectedPropertyId` from `useGlobalPropertySelection`; filter state; approve/reject with optimistic update, rollback + toast on error, refetch on 409. |
| `OwnerLeasesScreen.tsx` | New tab `{ id: 'tours', label: 'Tour Requests', icon: 'event', count: pending }` next to Pending Bookings; stat card "Tour Requests". |
| `src/features/leases/components/TourRequestCard.tsx` | Name, tap-to-call phone, mailto email, unit, slot (local time), status pill, Approve / Reject buttons (pending only). Theme tokens / glass styles as in existing lease cards. |
| `LeaseModals.tsx` | `RejectTourModal` with optional note (500-char counter). |

Staff with Custom Access need `LEASE_VIEW` to see the tab and `LEASE_UPDATE` to act. If they lack it, a 403 shows a "You don't have permission" toast (v1).

---

## 7. Security & privacy checklist
- Prospect endpoints derive the phone from the **server-side verified session**, never from client input.
- Close the public lead-detail PII leak (Â§4.3).
- Only property members with `LEASE_VIEW` see prospect contact details; decisions need `LEASE_UPDATE`.
- Mask phone numbers in logs (already done for OTP; apply to new logs and notification logs).
- Existing OTP rate limits (60 s cooldown, 5/hour) also throttle My Requests lookups.

---

## 8. Testing

**Backend**
- Unit: duplicate rule (same property blocks; other property allowed; rejected/cancelled/past don't block); transitions (approve/reject only `PENDING` + future; cancel only active + future; wrong phone â†’ 404); lifecycle job; event listeners call `sendToAddress` / owner `send`.
- Integration (MySQL 3307): unique index rejects a second active insert, and two concurrent creates end with one 201 + one 409; landlord list filters + unit numbers; `@PreAuthorize` (non-member 403, Custom Access without `LEASE_UPDATE` 403); stale active row auto-closed on create.
- `ModuleBoundaryTest` green.

**Frontend**
- Marketplace: 409 duplicate card; My Requests OTP â†’ list â†’ cancel; session restore from `sessionStorage`; status pill mapping.
- Landlord: tab + badge count, approve/reject calls, reject modal note, 409 refresh.

**Manual E2E (dev, OTP `000000`)**
1. Request a tour on a mom's pg room â†’ landlord (property owner account) sees it under Tour Requests â†’ Approve.
2. Prospect opens My Requests â†’ OTP â†’ sees **Approved**; console sender logs the SMS text.
3. Try another tour at the same property with the same phone â†’ blocked with link; a different property â†’ allowed.
4. Prospect cancels â†’ landlord sees Cancelled â†’ same phone can request again.
5. Reject with a note â†’ prospect sees the note.

---

## 9. Delivery phases
1. **Backend core:** migration, lifecycle + duplicate rule, landlord APIs, prospect APIs, PII fix, job, tests.
2. **Landlord UI:** Tour Requests tab, card, reject modal.
3. **Marketplace UI:** My Requests page, duplicate UX, confirmation copy, header link.
4. **Notifications:** `sendToAddress`, created/decided events, SMS/WhatsApp/email templates.

Phases 2 and 3 can run in parallel once phase 1 is merged. Phase 4 can ship last without blocking the UI (prospects can still check My Requests).

## 10. Open items to confirm during build
- Which seeded account owns the mom's pg properties, for manual testing (Livic Residency is `owner@livic.com`).
- Visit times are displayed in the viewer's local time and stored in UTC (current behaviour).
- Notification copy / WhatsApp template approval for production MSG91.
