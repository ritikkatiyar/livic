---
name: frontend-engineering
description: "Guardrail standards for Livic Landlord and Livic Resident (React Native / Expo Router / TypeScript). Theme/token compliance, responsive breakpoints, data-fetching, navigation chrome, file size, native/web polish, and code quality rules enforced against every PR."
---

# Senior Frontend Engineer - Production-Grade React Native / Expo Standards

Before generating or modifying any code, STRICTLY follow the guardrails defined below. These apply to both `livic-landlord-fe` and `livic-resident-fe` — they are one product family and must stay consistent with each other.

---

## ARCHITECTURE STANDARD

* Pattern: feature-based folder structure
* Module structure:
```
src/features/<feature>/
├── screens/
├── components/
├── hooks/
├── api/
```
* Routing: Expo Router (`app/`) — route files stay thin, orchestration only; real logic lives in `src/features/<feature>/`.
* Screens are composed from `src/components/common/` primitives, not rebuilt per screen.

---

## THEME & TOKEN GUARDRAILS

* **No hardcoded hex color literals** (`'#...'`) anywhere outside `src/theme/Theme.ts`. All colors must resolve through `useAppTheme()`.
* **No hardcoded numeric `fontSize` values** anywhere outside `src/theme/Theme.ts`. All typography must resolve through `useAppTheme()` Typography tokens.
* The app supports both light and dark mode (`src/theme/ThemeContext.tsx`, `LightColors`/`DarkColors`). Any hardcoded value that only reads correctly in one mode is a defect — flag it.
* Do not invent a new ad-hoc color/size value if an existing token is a close match. If no token fits, flag it for a token addition rather than hardcoding.

---

## TYPOGRAPHY & FONT GUARDRAILS (STRICT APPLE HIG)

* **Single Global Typography Source**: All text styling MUST resolve through `useAppTheme().Typography.*` tokens (or global theme tokens in `Theme.ts`). Every screen in the entire application follows the global typography tokens, NOT whatever each screen or component decides.
* **PROHIBITED: Local `fontFamily` Declarations**: Screens, components, and style files MUST NEVER define local `fontFamily` property overrides (such as `fontFamily: 'Inter'`, `fontFamily: 'Playfair Display'`, `'Roboto'`, `'Arial'`, etc.). Global font inheritance is strictly configured at the root level (`+html.tsx` on web, native system font on mobile) using Apple's San Francisco SF Pro font stack (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif`).
* **PROHIBITED: Excessive Boldness (800 / 900)**: Heavy weights (`'800'`, `'900'`, `ExtraBold`, `Black`) are strictly forbidden across the entire codebase. Per Apple Human Interface Guidelines:
  * Page titles, hero headings, stat metrics, CTA buttons: **Semibold (`'600'`)**.
  * Badges, status pills, filter pills, overlines, field labels: **Medium (`'500'`)**.
  * Body copy, hints, secondary text, descriptions: **Regular (`'400'` / `'normal'`)**.
* **PROHIBITED: Serif Fonts**: Editorial/serif fonts (`Playfair Display`, `Georgia`, `Times New Roman`) are strictly banned across all screens.
* **Automated Guardrail Enforcement**: Every PR and change must pass `npm run check:typography` and `TypographyGuardrail.test.ts`. Any file introducing hardcoded `fontFamily`, weights 800/900, or serif declarations will immediately fail CI.

---

## RESPONSIVE GUARDRAILS

* **Single breakpoint source**: all desktop/tablet/mobile checks MUST use the shared `useResponsive()` hook (`hooks/useResponsive.ts`).
* Never write an inline `width >= <number>`, `Dimensions.get('window').width` comparison, or any duplicate breakpoint literal inside a screen or component file.
* Breakpoint constants are defined once in `Theme.ts` (`Breakpoints.tablet`, `Breakpoints.desktop`) — reference them, never restate the number.

---

## DATA-FETCHING GUARDRAILS

* Server state MUST go through the shared React Query layer (`useQuery`/`useMutation`). A screen must never hand-roll its own `useState` + `useEffect` + `fetch`/`apiRequest` for data another hook already fetches.
* Before adding a new data-fetching hook, check whether a shared hook for that resource already exists (e.g. properties list, tenant list). Reuse it — do not create a second independent fetch of the same resource.
* Mutations MUST invalidate the relevant query key(s) on success so all consuming screens stay in sync without a manual refresh.
* API calls belong in the feature's `api/` module, not inlined directly inside a screen component.

---

## NAVIGATION & CHROME GUARDRAILS

* Primary navigation chrome (bottom nav bars, FABs) may use at most a **2-color gradient** drawn from the existing brand palette (`primary` / `secondary` / `accentGradientStart` / `accentGradientEnd`).
* **Prohibited on primary navigation elements**: multi-hue "rainbow" gradients (3+ unrelated hues), glow/halo shadow effects, playful iconography (sparkles, stars, bursts). This is a landlord/resident-facing B2B SaaS product, not a consumer novelty app.
* Expressive/playful visuals are reserved for onboarding and empty-state illustrations only — never primary chrome.
* `livic-landlord-fe` and `livic-resident-fe` must look like one coherent product family — do not let their nav treatments drift independently.

---

## LOADING & ERROR STATE GUARDRAILS

* Any screen loading more than a single data point MUST use the shared `<Skeleton>` primitive (`src/components/common/feedback/`), not a bare `ActivityIndicator`.
* Every screen must render a user-facing error state on fetch failure — never a silent failure or an uncaught throw.
* Every app must have a root-level `ErrorBoundary` wrapping the layout — an uncaught render error must show a themed fallback, never a blank/white screen.

---

## FILE SIZE & MAINTAINABILITY GUARDRAILS

* **No screen or component file over ~500 lines.** If a change would push a file past this, extract sub-components and/or hooks as part of the same PR rather than adding to an oversized file.
* Data-fetching, business logic, and rendering must be separated: screens orchestrate, hooks fetch/mutate, components render.
* No duplicated layout/styling logic across screens that could use an existing shared primitive (`GlassCard`, `StatCard`, `SectionHeader`, `ActionButton`, `StatusPill`, `EmptyState`, `ConfirmDialog`, etc.) — check for an existing primitive before writing new inline styling.

---

## NATIVE & WEB PLATFORM GUARDRAILS

* Native (Play Store): every screen with content near a screen edge must use `SafeAreaView`/`useSafeAreaInsets`, respecting notch/gesture-bar areas.
* Native: primary actions (successful submissions, destructive confirmations, toggles) should use `expo-haptics` feedback where consistent with existing patterns.
* Web (Vercel): every interactive element must have a visible keyboard-focus state — do not rely on hover-only affordances as the sole way to discover an action.
* Web: do not assume native-only touch-target sizing (e.g. 56px pill buttons) is correct at desktop viewport widths — confirm the desktop-variant sizing is actually applied via `useResponsive()`.

---

## TYPE SAFETY & CODE QUALITY RULES

* `any` and `as any` are prohibited except where genuinely unavoidable (e.g. a third-party type gap) — and must be accompanied by an inline comment explaining why.
* No commented-out code.
* No dead code — remove unused imports, variables, and helper functions immediately.
* No duplicate logic — check for an existing utility/hook/mapper before writing a new one.
* Debug logging must go through the shared `logger` utility (dev-gated), never raw `console.log`/`console.warn` left in committed code.
* User-facing errors must use the existing toast/error UX pattern, never raw `Alert.alert` unless that is the established pattern for that interaction type.

---

## TESTING RULES

* New shared hooks and primitives should include at least a basic test.
* Money-correctness flows (finance/billing screens and their equivalents) are the highest-priority area for test coverage — a PR touching these without any accompanying test coverage should be flagged.
* Every PR must keep `npm run quality` (lint, typecheck, test, build) passing.

---

## IMPORTANT

This project follows FAANG-grade engineering discipline, matching the standard held for the backend (`.agents/skills/backend-engineering/SKILL.md`).

Prioritize:
* clarity
* consistency across `livic-landlord-fe` and `livic-resident-fe`
* correctness of financial/data-critical flows
* accessibility of theme/mode/viewport handling

Do NOT overengineer. Do NOT introduce unnecessary abstractions. A guardrail violation should be flagged even if the surrounding code "already worked that way" — consistency with existing bad patterns is not a defense.
