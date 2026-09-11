---
name: frontend-quality
description: "FAANG-grade quality roadmap, lint rules, React hooks safety, TypeScript rules, shared UI layout primitives, split screen hooks patterns, offline Expo execution, and testing standards."
---

> **This is a progress-tracking roadmap, not the PR review source.** The PR-review agent (`auto-review-pr.js`) reads `.agents/skills/frontend-engineering/SKILL.md` (guardrails) + `.agents/rules/ui-consistency.md` (component patterns) for every frontend PR. Update those two files when a rule changes; use this file to track phase progress toward the quality score.

# Frontend FAANG Quality Roadmap

## Current Rating

Current frontend quality score: **~5.5 / 10** (verified against live codebase — see "Known Regressions" below)

The app is usable and visually strong, and `npm run build` succeeds. It is not yet at a FAANG-style production bar: several screens remain far too large, styling/tokens are inconsistently applied (light AND dark mode both affected), no server-state/cache layer exists yet, and test coverage is thin relative to screen count.

## Known Regressions (read before trusting any "COMPLETED" phase below)

This file previously claimed a 9.3/10 score with all 7 phases COMPLETE. That claim was not accurate against the actual codebase and caused the PR-review agent to review new PRs against a false baseline. Phase status below has been corrected against a live audit (line counts, grep checks) as of this update. **Any future edit marking a phase COMPLETE must be backed by a reproducible check (a `find`/`wc -l`/`grep` command and its output), not a description of intended work.**

Verified findings that contradict the old claims:
- Phase 4 ("Split Oversized Screens") was marked COMPLETE but 11+ screens remain over 900 lines, several over 1,800 (see Phase 4 below for the current list).
- Phase 5 ("API And Server State Layer"): `@tanstack/react-query` is installed and integrated in `livic-resident-fe` (with shared cache hooks in `src/hooks/useResidentData.ts`), while remaining legacy screens are progressively migrating away from local `useState`/`useEffect`/fetch.
- The "Mixed JS And TS" section below listed `.js` screens that no longer exist — confirmed via `find app src -name "*.js"` returning nothing. Section removed.
- Widespread hardcoded styling: 600+ hardcoded hex color literals and 800+ hardcoded numeric `fontSize` values exist outside `src/theme/Theme.ts`, despite `ui-consistency.md` prohibiting this. This causes real dark-mode contrast bugs (hardcoded colors don't adapt when the user switches theme mode) and cross-screen inconsistency.
- No error boundary exists anywhere in the app — an uncaught render error white-screens the whole app.

## Current Strengths

- Feature-based folder structure exists: `auth`, `finance`, `properties`, `tenant`, `inventory`, `announcements`, `analytics`, `ai`.
- Expo Router is used consistently for app routing.
- Authentication context, token persistence, refresh handling, and onboarding gate are already present.
- API calls generally go through a centralized `apiRequest` client with timeout, correlation ID, and token refresh behavior.
- Visual direction is strong: responsive layouts, operational dashboards, consistent brand colors, and meaningful use of icons.
- Web export succeeds with `npm run build`.

## Current Issues

### Build And CI Quality

- `npm run build` passes.
- `npx tsc --noEmit` fails.
- `npm run lint` fails with 1 error and many warnings.
- A FAANG-style baseline requires build, typecheck, and lint to pass in CI before feature work is considered complete.

### TypeScript Problems

Known strict TypeScript failures:

- `src/components/common/feedback/ToastContext.tsx`
- `src/components/common/inputs/GlassDropdown.tsx`
- `src/features/auth/screens/ModeSelectionScreen.tsx`
- `src/features/finance/screens/CreateExpenseScreen.tsx`
- `src/features/properties/screens/FloorEditorScreen.tsx`

Common causes:

- unsafe optional calls
- incorrect component ref typing
- implicit `any`
- mismatched DTO fields
- untyped route/icon/style casts

### Lint Problems

Known lint blocker:

- `src/components/common/navigation/BottomNavigation.tsx`
  - `useAuth` is called after an early return, which violates React hook rules.

Common warnings:

- unused imports and variables
- missing hook dependencies
- unused helper functions
- stale ref cleanup warnings

### Maintainability Problems

Several screens are too large and carry too many responsibilities:

- `FloorEditorScreen.tsx` is about 112 KB.
- `CommandCenterScreen.tsx` is about 52 KB.
- `MeterReadingScreen.tsx` is about 50 KB.
- `AnnouncementAdminScreen.tsx`, `CreateExpenseScreen.tsx`, `InventoryScreen.tsx`, and `BillingWorksheetScreen.tsx` are also large.

Problems caused by oversized screens:

- hard to review safely
- hard to test
- duplicated layout and styling
- business logic mixed with rendering
- harder backend integration later

### Design System Problems

- Many screens repeat gradients, glass cards, buttons, pills, section headers, empty states, modals, and responsive layout logic.
- Theme tokens exist, but usage is inconsistent.
- Several files define hardcoded colors and dimensions directly.
- Some components duplicate desktop/mobile shells instead of reusing primitives.

### API And Error Handling Problems

- The API client is a good foundation, but production logging is too noisy.
- Debug logs exist in API and screen flows.
- Errors are often handled with raw `Alert.alert` instead of a consistent toast/error UX.
- Some API calls are placed directly inside screens instead of feature API modules.
- No server-state/cache abstraction exists yet.

## Phase Plan

### Phase 1 - CI Baseline: Lint And Typecheck Clean [COMPLETED]

Goal: raise score from **6.5 to 7.2**.

Tasks:

- [x] Fix the React hook rule violation in `BottomNavigation.tsx`.
- [x] Fix strict TypeScript errors in:
  - `ToastContext.tsx`
  - `GlassDropdown.tsx`
  - `ModeSelectionScreen.tsx`
  - `CreateExpenseScreen.tsx`
  - `FloorEditorScreen.tsx`
- [x] Remove unused imports and unused variables that lint reports.
- [x] Fix missing hook dependencies where safe.
- [x] Add scripts if needed:
  - `typecheck`: `tsc --noEmit`
  - `quality`: run lint, typecheck, and build.

Acceptance:

- [x] `npm run lint` passes (0 errors).
- [x] `npx tsc --noEmit` passes (0 errors).
- [x] `npm run build` passes (0 errors).

### Phase 2 - Production Logging And Error UX [COMPLETED]

Goal: raise score from **7.2 to 7.6**.

Tasks:

- [x] Introduce a small logger wrapper with dev-only debug logs.
- [x] Remove verbose `console.log` calls from API and feature flows.
- [x] Keep warnings/errors only where operationally useful.
- [x] Standardize user-facing errors through toast/modal helpers.
- [x] Replace raw `alert()` usage with cross-platform `Alert` or existing toast patterns.
- [x] Ensure API errors do not leak sensitive request details.

Acceptance:

- [x] No uncontrolled debug logs in production paths.
- [x] API errors use a consistent user-facing message strategy.
- [x] Developer logs are gated by environment.

### Phase 3 - Shared UI Primitives [COMPLETED]

Goal: raise score from **7.6 to 8.0**.

Tasks:

- [x] Create reusable UI primitives:
  - `PageShell`
  - `ResponsiveHeader`
  - `GlassCard`
  - `StatCard`
  - `SectionHeader`
  - `ActionButton`
  - `StatusPill`
  - `EmptyState`
  - `ConfirmDialog`
- [x] Move repeated gradient/background styles into shared helpers.
- [x] Normalize color/font/radius usage through `Theme`.
- [x] Keep primitives small and domain-agnostic.

Acceptance:

- [x] New screens do not reimplement common page chrome.
- [x] At least finance, inventory, and announcements share core primitives.
- [x] Visual consistency improves without changing core workflows.

### Phase 4 - Split Oversized Screens [NOT STARTED]

Goal: raise score toward **8.0+**.

Current oversized screens (verified via `wc -l`, largest first — target is no screen over ~400-500 lines after decomposition):

- `src/features/properties/components/FloorLayoutViewerModal.tsx` — 1,867 lines
- `app/settings.tsx` — 1,403 lines
- `src/features/leases/screens/OwnerLeasesScreen.tsx` — 1,305 lines
- `src/features/properties/screens/CommandCenterScreen.tsx` — 1,302 lines
- `src/features/finance/screens/RentRollScreen.tsx` — 1,144 lines
- `src/features/finance/screens/CreateExpenseScreen.tsx` — 1,118 lines
- `src/features/finance/screens/BillingScreen.tsx` — 1,063 lines
- `src/features/properties/screens/CreatePropertyScreen.tsx` — 1,051 lines
- `src/features/finance/screens/MeterReadingScreen.tsx` — 947 lines
- `src/features/properties/screens/EditPropertyScreen.tsx` — 946 lines
- `src/features/finance/screens/BillingWorksheetScreen.tsx` — 935 lines

Tasks:

- [ ] Refactor `FloorLayoutViewerModal.tsx` first (largest, highest risk), extracting gesture/canvas logic, tenant assignment logic, desktop toolbar, mobile detail sheet, unit card/block components, and API orchestration into hooks/sub-components.
- [ ] Then refactor the remaining screens above, finance/billing screens prioritized first (money-correctness is highest UAT scrutiny).
- [ ] Combine this pass with the Phase 5 server-state migration per-screen (see below) rather than touching each file twice.

Acceptance:

- [ ] No screen file exceeds ~400-500 lines unless there is a documented strong reason.
- [ ] Complex screens are composed from focused components and hooks.
- [ ] Behavior is verified unchanged after each split (manual check + any existing tests).

### Phase 5 - API And Server State Layer [IN PROGRESS]

Goal: raise score toward **8.5+**.

Verified current state: `@tanstack/react-query` is installed and active in `livic-resident-fe` (`src/hooks/useResidentData.ts`). Screens are migrating to shared query hooks to eliminate duplicate independent fetches.

Tasks:

- [ ] Add `@tanstack/react-query`, wrap the app root in a `QueryClientProvider`.
- [ ] Convert shared list hooks (starting with `useProperties`) to `useQuery`, with mutations calling `invalidateQueries` on success.
- [ ] Move remaining screen-level API calls into feature API modules where not already done.
- [ ] Add a shared `<Skeleton>` loading primitive and use it in place of bare `ActivityIndicator` for any screen loading more than a single data point.
- [ ] Eliminate duplicate independent data-fetching across screens by routing through shared query hooks.

Acceptance:

- [ ] Screens mostly orchestrate UI, not request mechanics.
- [ ] A mutation in one screen is reflected in every other screen consuming the same data, without manual refresh.
- [ ] Loading/error/refetch behavior is predictable and uses shared primitives across modules.

### Phase 6 - JS To TS Migration [COMPLETED]

Goal: raise score from **8.8 to 9.0**.

Tasks:

- [x] Convert remaining `.js` screens to `.tsx`.
- [x] Convert `Theme.js` to `Theme.ts`.
- [x] Remove unsafe route/icon/style casts where practical.
- [x] Add shared types for common navigation and design tokens.

Acceptance:

- [x] No production app screen remains in JavaScript.
- [x] Strict TypeScript remains clean.
- [x] Theme typing prevents invalid token usage.

### Phase 7 - Frontend Testing Strategy [PARTIALLY STARTED]

Goal: raise score toward **9.0+**.

Verified current state: only 8 test files exist against ~29 screens. Coverage of the finance/billing money-correctness path (highest UAT scrutiny) is thin — only `BillingWorksheetScreen` has a test today.

Tasks:

- [x] A CI quality command exists (`npm run quality`: lint, typecheck, test, build).
- [ ] Add tests for the finance/billing flows first: `RentRollScreen`, `LedgerScreen`, `CreateExpenseScreen`, `MeterReadingScreen`.
- [ ] Add component tests for shared UI primitives (once Phase 3's primitives — `Skeleton`, `Pressable` — exist).
- [ ] Add interaction tests for high-risk flows: login/onboarding, property creation, floor editor basics, inventory move-in/out.
- [ ] Add smoke tests for critical routes.

Acceptance:

- [ ] Critical UI flows, especially money-correctness paths, have regression coverage.
- [ ] CI catches broken routes, type regressions, and key interaction failures.

Note: tests are far easier to write accurately once Phase 4's screen decomposition happens — a 1,800-line screen is not reasonably unit-testable. Sequence testing after decomposition, not before.

## Execution Order

Work one phase at a time. Verify each phase's "Acceptance" items with an actual command/check before marking it COMPLETE — see "Known Regressions" above for why this matters.

Recommended next phase: **Phase 4 - Split Oversized Screens**, combined with **Phase 5 - API And Server State Layer** on a per-screen basis (react-query migration + component extraction together, so each oversized file is touched once, not twice).

Phases 1-3 below are still accurate/complete per the codebase as verified; Phases 4, 5, and 7 were reset to their true state above.

## Definition Of Done For Each Phase

Each phase must:

- keep `npm run build` passing
- avoid unrelated refactors
- preserve existing user-facing behavior unless explicitly planned
- update this roadmap with completion notes
- leave the repo cleaner than it started

## Design & UI Consistency Rules (Aura Alignment)

Full design system rules live in `.agents/rules/ui-consistency.md` — the PR-review agent (`auto-review-pr.js`) concatenates that file with this one as its review guidelines. Treat both as one source of truth; do not duplicate/fork rules between them.

All screens and UI controls must strictly match the application's design system:
- **Modal Styling**:
  - Never use dark `tint="dark"` in `<BlurView>` overlays for dialogs/modals unless explicitly specified. Always use `tint="light"`.
  - Modal background overlays (`modalOverlay`) should use a soft translucent slate backdrop (e.g., `rgba(15, 23, 42, 0.3)`) instead of heavy black blocks.
  - Modal card containers (`modalContent`) must have soft borders (`borderWidth: 1`, `borderColor: 'rgba(255, 255, 255, 0.8)'`) and translucent backgrounds (`backgroundColor: 'rgba(255, 255, 255, 0.9)'`) to align with the rest of the application's glassmorphism style.

### Enforceable rules added after the theme/dark-mode audit (verify these on every PR)

- **No hardcoded hex colors or numeric `fontSize` values** outside `src/theme/Theme.ts`. All colors/typography must resolve through `useAppTheme()` tokens. This app supports both light and dark mode (`src/theme/ThemeContext.tsx`) — a hardcoded hex value cannot adapt between modes, and this is the direct cause of dark-mode contrast bugs (e.g. dark text staying dark-on-dark). Flag any `color: '#...'`, `backgroundColor: '#...'`, or `fontSize: <number>` literal found in a screen or component file.
- **Single breakpoint source**: all desktop/tablet/mobile checks must go through the shared `useResponsive()` hook (`hooks/useResponsive.ts`), never an inline `width >= <number>` literal. Multiple files hardcoding the same breakpoint independently is a regression risk — one file drifting from the rest silently breaks layout consistency.
- **No duplicate independent data-fetching** for shared/global data (e.g. the properties list). If a query hook already exists for that data, consume it — do not add a new local `useState`/`useEffect`/fetch for data another screen already fetches.
- **Primary navigation chrome restraint**: bottom nav bars and FABs may use at most a 2-color gradient from the existing brand palette. No multi-hue "rainbow" gradients (3+ unrelated hues), no glow/halo shadow effects, no playful iconography (sparkles/stars/bursts) on primary nav elements — this is a landlord/resident-facing B2B SaaS product, not a consumer novelty app. Reserve expressive visuals for onboarding/empty-state illustrations only.
- **Loading states**: any screen loading more than a single data point must use a shared `<Skeleton>` primitive rather than a bare `ActivityIndicator`, once that primitive exists (Phase 3 of the UAT-readiness plan).

