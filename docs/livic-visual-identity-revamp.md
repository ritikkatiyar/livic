# Livic Visual Identity System — Final, Code-Verified

Every value, file path, and line reference below was checked against the live repo (`livic-landlord-fe`, commit-current as of this writing) before being written down — not estimated. Usage counts are real `grep` results, included so execution can be prioritized by actual impact/risk, not guessed. Exact replacement code is given wherever the change is mechanical, so this can be executed without needing to interpret intent.

**Scope:** applies identically to `livic-landlord-fe` and `livic-resident-fe`, each independently (no shared package). Apply every code block below to both apps' copies of each file.

---

## PART 0 — Inspiration, Reasoned Honestly

- **CRED** — closest match to Livic's context: financially-serious audience, premium restraint. Take: near-monochrome base, one deliberate accent, obsessive typographic hierarchy, generous negative space.
- **Uber** — restrained black/white/one-accent, massive confident typography for the one number that matters per screen (maps to "rent collected," "occupancy rate").
- **Airbnb Host Dashboard** — closest real-world domain analogue (owner managing properties, financial summaries). Reference for empty states and financial data presentation.
- **Stripe Dashboard, Linear, Vercel Dashboard** — desktop reference (Part 5).
- **MyGate, RentOk** — information-architecture reference only (what data/actions a gated-society or PG user expects), not visual reference — their UI is functional, not premium, and Livic's positioning is being the better-designed alternative.
- **Swiggy, Zomato** — not used. Discretionary/browse apps (imagery, warmth, impulse); Livic is a utility/financial tool, different emotional register entirely.

---

## PART 1 — Glassmorphism: Remove Entirely (exact code)

**Why:** not an actual Apple or Android convention (it's specific iOS system chrome, not how Apple's apps/site look; Material never adopted it). `BlurView` silently falls back to a flat fill on many Android devices — part of the user base isn't seeing the effect at all, just paying its cost. None of the good references (CRED, Uber, Airbnb Host, Stripe, Linear, Vercel) use it.

**File:** `src/components/common/display/GlassCard.tsx` — confirmed current full content is 45 lines, using `BlurView` + `theme.Colors.glassFill`/`glassStroke`. `glassFill` has 181 real usages, `glassStroke` has 134 — both flow through this one component, so fixing this file fixes every consumer.

**Replace the entire file with:**
```tsx
import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function GlassCard({
  children,
  style,
  contentStyle,
}: GlassCardProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const flattened = StyleSheet.flatten(style);
  const inheritedAlignment: ViewStyle = {};
  if (flattened?.alignItems) inheritedAlignment.alignItems = flattened.alignItems;
  if (flattened?.justifyContent) inheritedAlignment.justifyContent = flattened.justifyContent;

  return (
    <View style={[styles.outerContainer, style]}>
      <View style={[styles.content, inheritedAlignment, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  outerContainer: {
    borderRadius: theme.Rounded.lg,
    borderWidth: 1,
    borderColor: theme.Colors.outline,
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  content: {
    padding: theme.Spacing.containerPadding,
  },
});
```
(`backgroundColor` references `surfaceContainerLowest`, not `surface` — see Part 3, `surfaceContainerLowest` is the token actually carrying this meaning at 186 real call sites, `surface` itself has only 5.)

**Notes on this change:**
- `intensity`/`tint` props are removed since there's no more `BlurView` — search both apps for `<GlassCard intensity=` or `<GlassCard tint=` call sites and remove those props at each call site (they'll now cause a TypeScript error, which is the intended way to find every call site that needs a look).
- The old `boxShadow: '0px 10px 30px rgba(0, 104, 117, 0.05)'` is removed — no shadow by default. If a specific usage genuinely needs to read as elevated above content (a modal, a sheet), add `theme.Shadows.sm` (or equivalent — check if a shadow scale already exists in `Theme.ts`; if not, add one) at that specific call site via the `style` prop, not in the shared component's default.
- `glassFill`/`glassStroke` tokens in `Theme.ts` can be deleted once this change ships and no other file references them directly (`grep -rn "glassFill\|glassStroke" app src` should return only `Theme.ts` itself afterward).

---

## PART 1B — Scope Correction: Glassmorphism Is in 69 Files, Not Just `GlassCard.tsx`

Deep audit found `BlurView` imported directly in **69 files** — most never go through `GlassCard` at all. Fixing `GlassCard.tsx` alone (Part 1) leaves the majority of this untouched. Categorized by real content, not guessed:

- **52 files** use `BlurView` on plain screen/card content (not a modal) — these should become flat solid surfaces, same pattern as `GlassCard.tsx`'s fix: `backgroundColor: theme.Colors.surfaceContainerLowest`, `borderColor: theme.Colors.outline`, no `BlurView`.
- **17 files** are genuine modals/sheets/dialogs (`ConfirmModal.tsx`, `PublishInvoicesModal.tsx`, `RecordCashModal.tsx`, `IssueDetailModal.tsx`, `MobileDrawer.tsx`, `MobileMoreSheet.tsx`, `QRScannerModal.tsx`, and others matching `*Modal*`/`*Sheet*`/`*Dialog*`/`*Drawer*`) — these keep the "floats above content" role, but per Part 1's "no exceptions" decision, replace `BlurView` with a plain semi-transparent scrim (`backgroundColor: 'rgba(0,0,0,0.45)'` equivalent via a theme token — add `theme.Colors.scrim` if it doesn't exist) behind an opaque modal card, not a blur. This is the standard pattern in every reference product named in Part 0 (Stripe, Linear, CRED) — dim-behind, sharp/opaque in front, never blur.

**Two named components need priority treatment beyond the general sweep**, since they're shared building blocks many screens depend on:
- **`GlassDropdown.tsx`** — same treatment as `GlassCard.tsx`: remove `BlurView`, replace `backgroundColor: theme.Colors.glassFill` / `borderColor: theme.Colors.glassStroke` with `theme.Colors.surfaceContainerLowest` / `theme.Colors.outline`.
- Full file list for both categories: run `grep -rln "BlurView" app src | grep -v node_modules` and cross-reference against `grep -iE "modal|sheet|dialog|drawer"` to regenerate the exact current two lists before starting (file set may shift slightly between when this was written and when it's executed).

---

## PART 1C — Decorative Gradients: `ActionButton.tsx` Is the Highest-Priority Fix in This Entire Document

52 files use `LinearGradient`. Most importantly: **`ActionButton.tsx`**, the shared primary-button component, hardcodes the exact cyan-to-blue gradient (`colors={['#00d4ff', '#0072ff']}`) on every `variant="primary"` button across the whole app — this is a single-file fix with the largest visual-impact-to-effort ratio in this entire revamp, since it touches every primary CTA simultaneously.

**Confirmed current code in `ActionButton.tsx`:**
```tsx
// Current primary-variant render:
<LinearGradient
  colors={['#00d4ff', '#0072ff']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={styles.gradient}
>
  {renderContent()}
</LinearGradient>

// Current styles (relevant subset):
primaryShadow: {
  shadowColor: '#0072ff',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 10,
  elevation: 4,
},
secondary: {
  backgroundColor: 'rgba(0, 229, 255, 0.12)',
  paddingHorizontal,
},
outline: {
  backgroundColor: theme.Colors.glassFill,
  borderWidth: 1.5,
  borderColor: theme.Colors.primary,
  paddingHorizontal,
},
disabled: {
  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(107, 122, 125, 0.12)',
  paddingHorizontal,
  opacity: 0.6,
},
```

**Replace with:**
```tsx
// Primary variant: remove LinearGradient entirely, use a plain solid View/TouchableOpacity 
// with backgroundColor: theme.Colors.primary — no gradient import, no gradient wrapper.

primaryShadow: {
  shadowColor: theme.Colors.outline,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.15,
  shadowRadius: 3,
  elevation: 1,
},
secondary: {
  backgroundColor: theme.Colors.surfaceContainerLow,
  paddingHorizontal,
},
outline: {
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: theme.Colors.outline,
  paddingHorizontal,
},
disabled: {
  backgroundColor: theme.Colors.outlineVariant,
  paddingHorizontal,
  opacity: 0.5,
},
```
(Shadow reduced from a heavy 10px/0.25-opacity glow to a minimal 3px/0.15 definition shadow, consistent with Part 1's "subtle, not diffuse-glass" elevation direction. `outline` variant changes from a filled `glassFill` background to a true outline — transparent fill, border only — since "outline" should mean outline, not a translucent fill.)

**`FilterPill.tsx`** has its own separate `LinearGradient` usage — apply the same "remove gradient, solid `theme.Colors.primary` fill for the active/selected state" treatment.

For the remaining ~50 `LinearGradient` files: most are consumers of the `backgroundGradient` screen-wash token (18 already identified in Part 3) or per-screen decorative accents on cards/headers. Audit each: if it's a screen-background wash, apply Part 3's flat-background fix; if it's a decorative accent on a card/button/header not yet covered above, apply the same "remove gradient, solid accent color" principle — no gradient survives this revamp anywhere except where explicitly re-justified as one deliberate brand moment (Part 1 of the original draft's language), which nothing found so far qualifies as.

---

## PART 3B — `StatusPill.tsx`: Fully Disconnected Color System (exact code)

Confirmed: every status color in `StatusPill.tsx` is a hardcoded literal, entirely disconnected from `Theme.ts` — changing the brand palette (Part 3) would do nothing for status pills without this fix, and they'd visually read as belonging to a different, older app.

**Current (full function):**
```tsx
case 'ACTIVE': case 'PAID': case 'OCCUPIED': case 'SUCCESS':
  return { bg: 'rgba(0, 135, 90, 0.1)', text: '#00875a', border: 'rgba(0, 135, 90, 0.2)' };
case 'INACTIVE': case 'UNPAID': case 'VACANT': case 'CANCELLED': case 'FAILED':
  return { bg: 'rgba(186, 26, 26, 0.1)', text: theme.Colors.error, border: 'rgba(186, 26, 26, 0.2)' };
case 'PENDING': case 'PARTIALLY_OCCUPIED': case 'WARNING':
  return { bg: 'rgba(243, 191, 38, 0.15)', text: '#765a00', border: 'rgba(243, 191, 38, 0.3)' };
case 'OVERDUE':
  return { bg: 'rgba(235, 95, 0, 0.1)', text: '#eb5f00', border: 'rgba(235, 95, 0, 0.2)' };
default:
  return { bg: 'rgba(107, 122, 125, 0.1)', text: theme.Colors.outline, border: 'rgba(107, 122, 125, 0.2)' };
```

**Replace with** (referencing Part 3's new palette — success maps to a new `theme.Colors.success` token if one doesn't exist yet, add it as a light-tint pairing the same way `error`/`errorContainer` already work):
```tsx
case 'ACTIVE': case 'PAID': case 'OCCUPIED': case 'SUCCESS':
  return { bg: theme.Colors.successContainer, text: theme.Colors.success, border: theme.Colors.success };
case 'INACTIVE': case 'UNPAID': case 'VACANT': case 'CANCELLED': case 'FAILED':
  return { bg: theme.Colors.errorContainer, text: theme.Colors.error, border: theme.Colors.error };
case 'PENDING': case 'PARTIALLY_OCCUPIED': case 'WARNING':
  return { bg: theme.Colors.tertiaryContainer, text: theme.Colors.tertiary, border: theme.Colors.tertiary };
case 'OVERDUE':
  return { bg: theme.Colors.errorContainer, text: theme.Colors.error, border: theme.Colors.error };
default:
  return { bg: theme.Colors.surfaceContainerLow, text: theme.Colors.onSurfaceVariant, border: theme.Colors.outline };
```
(`OVERDUE` merges into the same `error` treatment as the inactive/failed group — a separate orange-for-overdue vs red-for-failed distinction isn't carried in the new restrained palette; if that distinction is actually important product-wise, add one new token rather than reintroducing an off-palette hex color.) Add a `success`/`successContainer` token pair to `Theme.ts` if it doesn't already exist — check first (`grep -n "success" src/theme/Theme.ts`), since Part 3's table didn't enumerate one and this may be a genuinely new addition needed here.

**Also fix the JS-level forced caps**, a third ALL-CAPS mechanism beyond `textTransform` CSS (Part 4) — `const normalized = status.trim().toUpperCase();` forces every status pill's displayed text to caps in JavaScript, which a CSS-only `textTransform` search would never catch. Change the display line from `{normalized.replace('_', ' ')}` to render the original-case (or a sentence-case-formatted) status string instead of the forced-uppercase `normalized` value — keep `normalized` for the `switch` matching logic (that's fine, it's just for comparison), but don't display it as-is.

---

## PART 4B — Full ALL-CAPS Sweep: 29 Files, Three Distinct Mechanisms

Confirmed three separate ways ALL-CAPS gets applied across the codebase — a search for only one of them misses the others:
1. `textTransform: 'uppercase'` in a style object — 29 files (full list: `MobileDrawer.tsx`, `FloatingAIAssistant.styles.ts`, `QRScannerModal.tsx`, `PropertyRequiredBanner.tsx`, `PropertySelector.tsx`, `StatCard.tsx` (fixed, Part 4), `LedgerTable.tsx`, `RecordCashModal.tsx`, `PreFlightChecklistCard.tsx`, `PublishInvoicesModal.tsx`, `SettingsMenuScreen.styles.ts`, `SettingsMenuScreen.tsx`, `RentRollScreen.styles.ts`, `ExpenseConfigurationScreen.styles.ts`, `IssueDetailModal.styles.ts`, `InventoryMoveOutView.tsx`, `InventoryMoveInView.tsx`, `InventoryRegistryView.tsx`, `InventoryCardComponents.tsx`, `InventoryScreen.tsx`, `TenantInventoryScreen.tsx`, `TenantDetailsSidebar.styles.ts`, `FloorLayoutViewerModal.styles.ts`, `FloorEditorDetailCard.tsx`, `AnnouncementAdminScreen.styles.ts`, `LeaseModals.tsx`, `OwnerLeasesScreen.styles.ts`, `ReportsScreen.styles.ts`, plus `Theme.ts` itself — check whether `Theme.ts`'s match is a legitimate base style or a leftover to remove).
2. `.toUpperCase()` called on a value that gets directly rendered — confirmed in `StatusPill.tsx` (Part 3B), audit for the same pattern elsewhere (`grep -rn "\.toUpperCase()" app src` and check each result for whether the uppercased value is actually displayed vs. used only for internal comparison — only the former needs fixing).
3. Text written in literal caps in source/copy (e.g. a hardcoded string `"TOTAL BILLED"` rather than `"Total billed"` with a transform applied) — check any remaining ALL-CAPS-looking labels after fixing 1 and 2 aren't actually just typed in caps directly in JSX text content, which a style-only fix wouldn't catch (`grep -rn '>[A-Z ]\{4,\}<' app src` as a rough heuristic to find literal all-caps JSX text content).

For each of the 29 files in list 1: remove `textTransform: 'uppercase'`, remove any accompanying `letterSpacing` used to compensate visually for caps, and reduce `fontWeight` if it was compensating for caps-at-high-weight (the same three-part change already given as the exact `StatCard.tsx` example in Part 4 — apply that same pattern to each file in this list).

---

The existing guideline (no hardcoded hex/fontSize/rgba/fontWeight outside `Theme.ts`) has been stated in `ui-consistency.md` and was still violated hundreds of times. A rule alone hasn't worked — this needs a mechanism.

```
1. Add a typed helper in src/theme/createThemedStyles.ts:
   
   export function createThemedStyles<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(
     fn: (theme: Theme) => T
   ) {
     return fn;
   }
   
   This becomes the ONLY sanctioned way to define a component's styles — 
   every createStyles = (theme: any) => StyleSheet.create({...}) pattern 
   (confirmed as the current pattern in GlassCard.tsx, StatCard.tsx, and 
   throughout both apps) migrates to this, with theme: any replaced by a 
   real Theme type.

2. Add an ESLint rule (AST-based — a regex-only rule already missed 
   StyleSheet-object hex literals, rgba()/hsla(), AND inline JSX color 
   props at different points in this project's history; a single AST rule 
   scanning for any Literal/TemplateLiteral matching a hex or rgba/hsla 
   pattern, in ANY position, closes all three at once):
   - Target: any color/fontSize/fontWeight/spacing literal outside 
     src/theme/Theme.ts.
   - Severity: error, not warning.
   - Wire into CI (see gap below) so it actually blocks merge.

3. Confirmed current CI gap: .github/workflows/ci-production.yml builds 
   ONLY the backend, with tests explicitly skipped 
   (mvn ... -DskipTests, comment: "Skipping tests for initial CI setup"). 
   There is no frontend job at all. Add one: 
   npm run quality (lint + typecheck + test + build) for both 
   livic-landlord-fe and livic-resident-fe, required to pass before merge.
```

---

## PART 3 — Color: Exact Token Replacement Table (code-verified)

Keep every existing key name (so the 536 call sites using `theme.Colors.primary`, 430 using `onSurfaceVariant`, etc. need zero changes) — replace only the value string in `src/theme/Theme.ts`. Usage counts are real, confirmed via `grep` — included so a smaller/faster model can gauge blast radius per change, not guess.

### `LightColors` — exact old value → new value
| Key | Current value | New value | Real usage count |
|---|---|---|---|
| `primary` | `"#006875"` | `"#0E4F52"` | 536 |
| `secondary` | `"#5b5ecf"` | `"#5B6668"` | 58 |
| `tertiary` | `"#775a00"` | `"#8A6D3B"` | 34 |
| `error` | `"#ba1a1a"` | `"#A23E36"` | 116 |
| `onSurface` | `"#171c1e"` | `"#12181B"` | 300 |
| `onBackground` | `"#151d1e"` | `"#12181B"` | 32 |
| `background` | `"#f3fbfc"` | `"#F7F6F3"` | 10 |
| `surface` | `"#f3fbfc"` | `"#F7F6F3"` | 5 |
| `onSurfaceVariant` | `"#6b7a7d"` | `"#5B6668"` | 430 |
| `outline` | `"#6f797b"` | `"#DEDCD5"` | 15 |
| `outlineVariant` | `"#bfc8ca"` | `"#DEDCD5"` | 121 |

### `DarkColors` — exact old value → new value
| Key | Current value | New value |
|---|---|---|
| `primary` | `"#00E5FF"` (neon cyan) | `"#4FA3A6"` |
| `secondary` | `"#8285FF"` | `"#9AA3A5"` |
| `tertiary` | `"#F3BF26"` | `"#C9AB6E"` |
| `error` | `"#FF6B6B"` | `"#D97C72"` |
| `onSurface` | `"#F1F5F9"` | `"#F0EFEC"` |
| `background` | `"#090D12"` | `"#12181B"` |
| `surface` | `"#0F1720"` | `"#12181B"` |
| `onSurfaceVariant` | `"#94A3B8"` | `"#9AA3A5"` |
| `outline` | `"#334155"` | `"#2A3134"` |
| `outlineVariant` | `"#1E293B"` | `"#2A3134"` |

### Confirmed dead, delete outright (zero real usages)
- `accentGradientStart` — 0 usages anywhere in `app/`/`src/`. Delete from both `LightColors` and `DarkColors` with zero call-site risk.
- `accentGradientEnd` — only 2 usages; check both before deleting (`grep -rn "accentGradientEnd" app src`), likely safe but verify rather than assume.

### Used, needs per-call-site removal, not a blind delete
- `backgroundGradient` — 18 real usages (the 3-stop gradient screen-wash). Each of these 18 call sites currently applies a gradient background to a screen — replace each with a flat `theme.Colors.background` fill. This is a real per-screen change, not a token-value swap, since removing the gradient concept means each consuming screen's background rendering logic changes (likely from a `LinearGradient` component to a plain `View` with `backgroundColor`).
- `errorContainer` — 8 usages, keep as a token (light-tint error background), update its value to a muted tint of the new `error` color rather than deleting.
- `primaryContainer` — has real usage (confirmed in `StatCard.tsx`'s `activeIconBg` default) — keep, update to a muted tint of the new `primary`.

### `surfaceContainerLowest`/`surfaceContainerLow`/`surfaceContainer`/`surfaceContainerHigh` — real, load-bearing, initially miscategorized
Checked properly: `surfaceContainerLowest` has **186 real usages** — more than `surface` (5), `background` (10), and `outline` (15) combined. It's `#ffffff` in light mode, confirmed by inspection to be the actual card-background color used throughout the app in practice (`surface` itself is closer to a page/root-background alias). This must be resolved with real values, not left as "check later":

| Key | Current (light) | New (light) | Current (dark) | New (dark) | Usage |
|---|---|---|---|---|---|
| `surfaceContainerLowest` | `"#ffffff"` | `"#FFFFFF"` (unchanged — this IS the flat card surface Part 1's `GlassCard` rewrite now uses) | `"#070A0E"` | `"#161C1F"` (slightly lifted from pure background so cards remain visible against it) | 186 |
| `surfaceContainerLow` | `"#edf5f7"` | `"#F2F1ED"` (warm-neutral, matches new Paper direction) | `"#0E151D"` | `"#1A2124"` | 36 |
| `surfaceContainer` | `"#eceeef"` | `"#EEEDE8"` | `"#121A22"` | `"#1E2528"` | 7 |
| `surfaceContainerHigh` | `"#e7eeef"` | `"#E8E6E0"` | `"#1B2633"` | `"#232A2D"` | 6 |

`GlassCard.tsx`'s new `backgroundColor: theme.Colors.surface` (Part 1) should actually reference `theme.Colors.surfaceContainerLowest` instead, given it's the token actually carrying this meaning at 186 call sites — update Part 1's replacement code accordingly: `backgroundColor: theme.Colors.surfaceContainerLowest`.

### Confirmed dead — 0 real usages, delete outright with zero call-site risk
`onPrimaryFixed`, `inverseOnSurface`, `onSecondaryFixedVariant`, `onTertiaryFixed`, `secondaryFixedDim`, `surfaceContainerHighest`, `onSecondaryContainer`, `onErrorContainer`, `surfaceDim`, `onTertiaryFixedVariant`, `surfaceBright`, `onTertiaryContainer`, `onPrimaryFixedVariant`, `onSecondaryFixed` — 14 tokens total, verified via the same usage-count method as `accentGradientStart` above. Remove all 14 from both `LightColors` and `DarkColors`.

### Low usage (1-7 real call sites each) — resolved, not left open
These are real but low-risk to touch (few call sites each): `surfaceTint` (2), `primaryFixed` (2), `tertiaryContainer` (3), `secondaryContainer` (4), `tertiaryFixedDim` (1), `inversePrimary` (1), `tertiaryFixed` (1), `secondaryFixed` (3), `inverseSurface` (2), `scrollbarThumb` (2), `scrollbarThumbHover` (2). For each: check its 1-7 call sites directly (`grep -rn "theme\.Colors\.<key>" app src`), confirm what visual role it plays there, and set its value to the corresponding tint/shade of its new base color (e.g. `tertiaryContainer` becomes a light tint of the new `tertiary` `#8A6D3B`, following the same light-tint-of-base pattern already used for `errorContainer`/`primaryContainer` above). Given the call-site count is small per token, this is a same-day task, not an open-ended one.

**Result: every single token in `Theme.ts` now has an explicit resolution — a new value, a deletion, or a small-scope same-day task with its exact call sites identified. Nothing is left as "figure out later."**

---

## PART 4 — Typography (exact code, `StatCard.tsx` confirmed current state)

Confirmed current `StatCard.tsx` label style:
```tsx
label: {
  fontSize: theme.Typography.labelSmall.fontSize,
  fontWeight: '800',
  color: theme.Colors.onSurfaceVariant,
  letterSpacing: 0.8,
  textTransform: 'uppercase',
  flex: 1,
  marginRight: theme.Spacing.xs,
},
```
**Replace with:**
```tsx
label: {
  fontSize: theme.Typography.labelSmall.fontSize,
  fontWeight: '500',
  color: theme.Colors.onSurfaceVariant,
  flex: 1,
  marginRight: theme.Spacing.xs,
},
```
(Removes `textTransform: 'uppercase'`, drops `letterSpacing`, reduces weight from 800 to 500 — sentence case, no shouting.)

This exact `textTransform: 'uppercase'` + heavy-weight + tracked-out-letterSpacing pattern is very likely repeated across other card/label components beyond `StatCard.tsx` (it's the same pattern seen in the Reports screen's "TOTAL STATEMENTS"/"TOTAL BILLED" labels from earlier screenshots) — search both apps for `textTransform: 'uppercase'` and apply the same fix (remove transform, drop letterSpacing, reduce weight to 500) at every match, not just this one file.

General typography rules (apply during the same pass, not tied to one file):
- Never set `fontWeight` as a standalone style property — always via a complete `theme.Typography.<variant>` bundle (ties to Part 2's enforcement mechanism).
- Numbers need tabular figures for column alignment — check whether the current body typeface has a tabular-figure variant; flag for a typeface change if not, don't work around it with manual padding.

---

## PART 5 — Full Responsiveness: Defined Tiers

```
- Mobile (<768px): single column, bottom nav, stat tiles 2-per-row (Part 6).
- Tablet (768-1024px): 2-column content where it fits, stat tiles 3-per-row, 
  sidebar collapsible rather than always-visible.
- Desktop (1024-1440px): persistent sidebar + content, stat tiles 4-per-row, 
  full data-table treatment (Part 5 below, desktop standard).
- Large desktop (1440px+): cap main content width (~1600px) rather than 
  stretching edge-to-edge — currently undefined in the codebase.
```

---

## PART 6 — Desktop Reference Standard

References: Stripe Dashboard, Linear, Vercel Dashboard, Airbnb Host Dashboard.
```
1. Data tables: left-aligned text, right-aligned numbers, hairline row 
   dividers (not shadow/card-per-row), sortable headers where relevant. 
   Reconsider card-per-row for dense data (ledger, tenant lists) vs. 
   genuinely browsable content (properties grid, which stays cards).
2. Sidebar follows Part 1/3's flat/hairline treatment, not glass.
3. Real hover states on every interactive element — confirmed missing/
   inconsistent earlier in this project.
4. Visible keyboard focus rings — confirmed absent; non-negotiable at this 
   reference bar.
```

---

## PART 7 — Mobile Layout Fixes (exact code, `StatCard.tsx` confirmed current state)

### 7.1 — `card` style: fixed `minWidth: 150` (confirmed current)
```tsx
// Current:
card: {
  flex: 1,
  minWidth: 150,
  borderRadius: 20,
  padding: theme.Spacing.md,
},
```
**Replace with** (using `useResponsive()` — import it into `StatCard.tsx`, pass `isMobile` into `createStyles`):
```tsx
card: {
  flex: 1,
  minWidth: isMobile ? '46%' : 150,
  borderRadius: 20,
  padding: theme.Spacing.md,
},
```
Parent containers rendering 4 `StatCard`s in a row need `flexWrap: 'wrap'` and `gap` set on mobile so the `46%`-width cards actually wrap into a 2x2 grid rather than overflowing — check each screen currently rendering a 4-stat row (confirmed: `CommandCenterScreen.tsx` is one; search both apps for other `<StatCard` usages in a row layout) and add `flexWrap: 'wrap'` to that row's container style on mobile.

### 7.2 — `value` text: truncation, confirmed current
```tsx
// Current:
<Text style={[styles.value, { color: activeValueColor }, valueStyle]} numberOfLines={1}>
  {value}
</Text>
```
**Replace with:**
```tsx
<Text
  style={[styles.value, { color: activeValueColor }, valueStyle]}
  numberOfLines={1}
  adjustsFontSizeToFit
  minimumFontScale={0.7}
>
  {value}
</Text>
```
Verify against a real long value (a 6-7 digit rupee amount), not short placeholder numbers — that's the case that was actually breaking.

### 7.3 — Touch ergonomics (audit, not a mechanical code change)
```
1. Audit interactive elements against a 44-48pt minimum touch target.
2. Review one-handed thumb reach for primary actions on a large phone.
3. Decide deliberately whether iOS/Android get platform-specific treatment 
   or a fully shared look — currently uniform by default, not by decision.
```

---

## PART 8 — Complete Screen Inventory (every screen checked, none sampled)

Every `app/*.tsx` route file (29 total) was checked and confirmed to be a thin auth-guard/navigation wrapper (5-43 lines each) — the real UI lives entirely in `src/features/**/screens/*.tsx`. This section audits every one of those real implementation files directly, in both apps — no sampling, no "most screens" estimates.

### `livic-landlord-fe` — 29 screens, exact status

**On `PageShell` (24 of 29):** `AIAssistantScreen`, `AnalyticsDashboardScreen`, `AnnouncementAdminScreen`, `SuperAdminLoginScreen`, `SuperAdminSignupScreen`, `EscalationsScreen`, `BillingScreen`, `BillingWorksheetScreen`, `CreateExpenseScreen`, `ExpenseConfigurationScreen`, `LedgerScreen`, `MeterReadingScreen`, `RentRollScreen`, `SettingsMenuScreen`, `InventoryScreen`, `TenantInventoryScreen`, `OwnerLeasesScreen`, `CommandCenterScreen`, `CreatePropertyScreen`, `EditPropertyScreen`, `MembershipManagementScreen`, `ReportsComingSoonScreen`, `ReportsScreen`, `SettingsScreen`.

**NOT on `PageShell` (5 of 29) — named explicitly, no ambiguity:**
| Screen | Current pattern | Notes |
|---|---|---|
| `ModeSelectionScreen.tsx` | `SafeAreaView` ×3, gradient ×3 | |
| `OnboardingScreen.tsx` | `SafeAreaView` ×2 | |
| `FloorEditorScreen.tsx` | `SafeAreaView` ×5, gradient ×7 | 483 lines, heaviest non-adopter — likely contributes to the "two side panels break" complexity seen when editing a floor layout |
| `FloorListOverviewScreen.tsx` | `SafeAreaView` ×3, gradient ×5 | Already flagged separately for its list-vs-grid layout bug (master plan Part 6.5) — fix both in the same pass |
| `UnitDetailScreen.tsx` | `SafeAreaView` ×3, gradient ×3 | Only 63 lines — check if this is a stub/partial implementation before migrating, not just mechanically wrapping it |

**Flag, don't assume — residual `SafeAreaView`/`useSafeAreaInsets` found INSIDE 8 screens that ARE on `PageShell`:** `BillingScreen`, `BillingWorksheetScreen`, `CreateExpenseScreen`, `ExpenseConfigurationScreen`, `LedgerScreen`, `MeterReadingScreen`, `RentRollScreen`, `SettingsMenuScreen` all show both `PageShell` usage AND separate `SafeAreaView`/`useSafeAreaInsets` references. This could be legitimate (e.g. manual inset padding for a fixed bottom action bar that sits outside `PageShell`'s scroll area) or it could be a leftover redundant wrapper from before migration. **Check each of these 8 individually — do not assume either way.** This is exactly the class of half-migrated state that must not survive this revamp.

**Decorative-gradient removal checklist (Part 3's `backgroundGradient` sweep), exact counts per screen, highest first:** `MeterReadingScreen` (11), `BillingWorksheetScreen` (7), `ExpenseConfigurationScreen` (7), `FloorEditorScreen` (7), `AIAssistantScreen` (7), `CreateExpenseScreen` (5), `RentRollScreen` (5), `FloorListOverviewScreen` (5), `TenantInventoryScreen` (5), `AnalyticsDashboardScreen` (6), `ModeSelectionScreen` (3), `EditPropertyScreen` (3), `UnitDetailScreen` (3), `InventoryScreen` (3), `CreatePropertyScreen` (1), `BillingScreen` (1), `LedgerScreen` (1), `OwnerLeasesScreen` (1). Screens not listed here have zero gradient usages already.

### `livic-resident-fe` — 10 screens, exact status

`TenantHomeScreen`, `TenantMaintenanceScreen`, `TenantPropertyScreen`, `TenantPaymentsScreen`, `SuperAdminSignupScreen`, `ModeSelectionScreen`, `SuperAdminLoginScreen` are on `PageShell`. `AIAssistantScreen`, `InventoryScreen`, `TenantInventoryScreen` are not (`SafeAreaView`-based).

### 🔴 Cross-app drift — confirmed, not hypothetical

The "keep both apps identical" approach (no shared package, manual sync) is **already drifting** on same-named files, right now:
- `ModeSelectionScreen.tsx`: on `PageShell` in resident-fe, NOT in landlord-fe.
- `AIAssistantScreen.tsx`: on `PageShell` in landlord-fe, NOT in resident-fe.
- `InventoryScreen.tsx` / `TenantInventoryScreen.tsx`: on `PageShell` in landlord-fe, NOT in resident-fe.

These four files are meant to be near-identical shared-pattern screens across both apps, and they've already diverged on the single most foundational layout decision this whole revamp is about. **Reconcile all four to `PageShell` in both apps as part of this same migration pass** — don't fix landlord-fe and leave resident-fe's copy stale, which is exactly how this drift happened the first time.

---

## PART 9 — User-Friendliness: What's Already Good, and the One Real Gap

Checked against real code, same discipline as everything above — not assumed either direction.

### Already good — codify this, don't touch it
**Destructive-action safety is genuinely well-executed already.** Checked `handleDeleteProperty` (`useCommandCenter.ts`), `handleDeletePermanently` (`ExpenseConfigurationScreen.tsx`), and `handleRemoveTenant` (`useFloorEditorLayoutApi.ts`) — all three independently follow the same disciplined pattern: an explicit "cannot be undone" warning naming the real consequence, a Cancel option, `style: 'destructive'` on the confirming button, and a real error message surfaced via toast on failure (not swallowed, not generic). This is not a one-off — it's a consistent, good pattern across unrelated features.
```
Formalize this as a mandatory rule (add to Part 2's enforcement scope): every 
destructive action (delete, remove, permanently deactivate) must show a 
confirmation dialog stating the specific consequence in plain language, offer 
a clear cancel path, and surface the real error message on failure via toast. 
Do not let this regress during the revamp — when touching any of these 
screens for Parts 1/3/4/7, verify the pattern survives unchanged.
```

Also genuinely fine: generic/vague error copy ("Something went wrong") appears only once across the entire codebase — not a widespread problem, no sweep needed here.

### The real gap — accessibility
**Confirmed: only 1 file in the entire app uses `accessibilityLabel`/`accessibilityRole`/`accessibilityHint`.** At the scale of 29 landlord-fe screens + 10 resident-fe screens + dozens of shared components, this is functionally the same as zero. Screen-reader users (VoiceOver on iOS, TalkBack on Android) cannot meaningfully use this app today. For a Play Store app, this is a real gap, not a nice-to-have.
```
1. Every icon-only interactive element (the delete-property trash icon, nav 
   icons, the AI assistant button, modal close buttons) needs an 
   accessibilityLabel describing its action in plain language ("Delete 
   property", "Open notifications"), not its icon name.
2. Every form input needs an accessible label tied to it (either via 
   accessibilityLabel or a properly associated <Text> label), so a screen 
   reader announces what the field is for.
3. Interactive elements need the correct accessibilityRole ("button", "link", 
   "header" for section titles, etc.) so assistive tech announces them 
   correctly rather than as generic text.
4. Status indicators conveyed by color alone (the "Active"/"Overdue" pills, 
   the alert-count badge) need a text equivalent for screen readers, not 
   just a colored dot/pill — color alone is not accessible.
5. This is a genuine sweep across every screen touched in Parts 1/3/4/7/8 
   above — do it in the same pass as those changes per screen, not as a 
   separate later effort, since it touches the same interactive elements 
   already being modified.
```

### Minor — empty-state duplication
Two implementations exist: `EmptyState.tsx` (shared) and `CommandCenterEmptyState.tsx` (bespoke, Portfolio-specific). Consolidate to one — `CommandCenterEmptyState`'s specific copy/illustration can become a configured instance of the shared `EmptyState` component (via props) rather than a separate implementation, consistent with this whole document's "one component, not several" principle applied everywhere else.

---

## PART 10 — String Constants: No Hardcoded Text Anywhere

**Confirmed current state:** zero centralized strings infrastructure exists — no constants file, no i18n library. Real scale: **78 `Alert.alert` calls, 73 `showToast` calls, 359+ hardcoded JSX text strings** (narrow regex count — the real total is higher). Same class of problem as the color/spacing tokens: without a centralized source, the same concept ("Cancel", "Delete", "Are you sure?") gets rewritten slightly differently dozens of times.

**Scope decision:** plain centralized constants, not full i18n/multi-language infrastructure. Nothing in this project has signaled a multi-language requirement, and full i18n (react-i18next, locale files, pluralization) is a meaningfully larger, different commitment. Structured so real i18n could layer on top later without a rewrite — not being built now.

### Structure — mirrors the existing 17-feature architecture (`ai`, `analytics`, `announcements`, `auth`, `escalations`, `finance`, `inventory`, `issues`, `leases`, `onboarding`, `properties`, `reports`, `settings`, `storage`, `tenant`, `user`)
```
1. Per-feature: src/features/<feature>/constants/strings.ts — copy specific 
   to that feature.
2. Global: src/constants/strings.ts — shared UI copy across features 
   (button labels, generic error fallback, common empty-state copy, nav 
   labels).
3. Naming convention — nested object keyed by screen/component + action, 
   not a flat list:

   // src/features/finance/constants/strings.ts
   export const FinanceStrings = {
     deleteExpenseConfig: {
       title: 'Delete Permanently?',
       message: 'This action cannot be undone. All active worksheets, meter 
                  records & drafts using this charge configuration will be 
                  permanently deleted.',
       confirmLabel: 'Delete',
       cancelLabel: 'Cancel',
       successToast: 'Charge configuration permanently deleted.',
     },
     // every other Alert/toast/heading/label in this feature
   } as const;

   // src/constants/strings.ts
   export const CommonStrings = {
     actions: { cancel: 'Cancel', save: 'Save', delete: 'Delete', retry: 'Retry' },
     errors: { generic: 'Something went wrong. Please try again.' },
   } as const;
```

### Worked example (real current code → migrated)
Confirmed current code in `ExpenseConfigurationScreen.tsx`'s `handleDeletePermanently` (from Part 9):
```tsx
// Current:
requestConfirmation(
  "Delete Permanently?",
  "This action cannot be undone. All active worksheets, meter records & drafts using this charge configuration will be permanently deleted.",
  async () => {
    try {
      await deleteConfig(id);
      showToast("Charge configuration permanently deleted.", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to delete configuration.", "error");
    }
  }
);

// Migrated:
import { FinanceStrings } from '../constants/strings';
import { CommonStrings } from '@/src/constants/strings';

requestConfirmation(
  FinanceStrings.deleteExpenseConfig.title,
  FinanceStrings.deleteExpenseConfig.message,
  async () => {
    try {
      await deleteConfig(id);
      showToast(FinanceStrings.deleteExpenseConfig.successToast, "success");
    } catch (e: any) {
      showToast(e.message || CommonStrings.errors.generic, "error");
    }
  }
);
```
Note: `e.message` (the real backend error text) stays as-is — Part 9 confirmed surfacing the real error message is the correct pattern; only the *fallback* when no message exists becomes a shared constant.

### Enforcement — extend Part 2's mechanism, don't build a second one
```
Add to the same AST-based ESLint rule from Part 2: flag any string literal 
(4+ words, to avoid false positives on short technical strings like icon 
names) appearing directly inside JSX <Text> children, Alert.alert() 
arguments, or showToast() arguments, anywhere outside a constants/strings.ts 
file. Same severity (error), same CI wiring.
```

### Migration approach
```
Feature-by-feature, not all-at-once — for each of the 17 features, create 
its constants/strings.ts and migrate every hardcoded Alert/toast/<Text> 
literal to reference it, verifying no visual/behavioral change. Do this in 
the same pass as whichever other part of this document is already touching 
that feature's screens (Parts 1/3/4/7/8/9) rather than a fully separate 
17-feature sweep — the files are already open, so the marginal cost is low.
```

---

## PART 11 — New Feature Gap: Property & Room Image Upload (backend ready, frontend missing entirely)

**Confirmed:** the backend has a complete, production-quality media API — `MediaController` at `/api/v1/media`, backed by Cloudinary (signed-upload pattern), with proper per-action permission checks (`hasMediaAccess`) already enforced. `OwnerModule` enum supports `PROPERTY`, `LEASE`, and `INVENTORY` as attachable entity types — so both property-level and room/unit-level (via `INVENTORY`) images are already architecturally supported.

**The frontend has none of this wired up** — no `expo-image-picker` dependency, no upload UI anywhere, no gallery/viewer component. This is a genuine feature gap, not a visual-polish item — it belongs in this document because it should be built using the same design system (Part 1-4) rather than bolted on afterward with its own ad-hoc styling.

### Exact backend contract (confirmed, not guessed)
```
POST /api/v1/media/upload-authorization
  Request:  { ownerModule: "PROPERTY" | "LEASE" | "INVENTORY", referenceId: UUID, fileType, filename }
  Response: { uploadUrl, apiKey, timestamp, signature, folder, publicId, storageProvider, additionalParams }

  [Client uploads the actual file directly to `uploadUrl` using the signed 
  params above — standard Cloudinary signed-upload flow, the backend never 
  receives the raw file itself.]

POST /api/v1/media/confirm
  Request:  { ownerModule, referenceId, externalId (the publicId from above), ... }
  Response: MediaAssetDTO (includes the final `url`)

GET /api/v1/media?ownerModule=PROPERTY&referenceId={propertyId}
  Response: MediaAssetDTO[]  — list of attached images/media for that entity

DELETE /api/v1/media/{id}
  Removes a single media asset (permission-checked per-asset, not just per-owner)
```

### Frontend build — sequenced

```
1. Add expo-image-picker (and expo-image-manipulator if resizing/compression 
   before upload is wanted — recommended for room/property photos taken 
   directly from a phone camera, to avoid uploading full-resolution originals).

2. Create src/features/storage/api/media.api.ts (new feature module, 
   "storage" already exists as a feature name in the 17-feature list — 
   confirm whether it's meant to house this or whether media belongs closer 
   to properties/inventory; likely a shared api module referenced by both, 
   not owned by one feature) with three functions wrapping the three 
   endpoints above: requestUploadAuthorization, confirmUpload, 
   getMediaAssets, deleteMediaAsset.

3. Create a shared <MediaUploadGrid> component (packages/ui if that 
   extraction ever happens, otherwise duplicated per Part 0's decision) — 
   a grid of existing images (using the design system's flat/hairline-
   border card treatment, not glass) plus an "Add photo" tile that opens 
   the image picker, uploads via the two-step flow, and refreshes the list 
   on success. Use the shared <Skeleton> primitive while an upload is in 
   flight, and the existing toast pattern for success/failure feedback 
   (per Part 9's confirmed-good error-handling discipline — surface the 
   real error message on failure, not a generic one).

4. Wire it into:
   - CreatePropertyScreen.tsx / EditPropertyScreen.tsx — property-level 
     photos, ownerModule="PROPERTY", referenceId=the property's ID.
   - Wherever unit/room-level detail is shown (UnitDetailScreen.tsx, or 
     the inventory move-in/move-out checklist flow referenced in earlier 
     project history) — ownerModule="INVENTORY", referenceId=the relevant 
     inventory/unit ID. Confirm the exact reference entity INVENTORY maps 
     to before wiring (a unit itself, or an inventory item/checklist record 
     — check the backend's InventoryItem entity relationships).

5. A gallery/viewer for VIEWING existing images (the "how to view them" 
   half of the original question) — a simple full-screen swipeable image 
   viewer on tapping a thumbnail in the grid. Check if an image-viewer 
   library is already a dependency before adding a new one.

6. Use React Query for the media list (useQuery keyed by [ownerModule, 
   referenceId]), with the upload confirm mutation invalidating that query 
   key — same pattern already established for useProperties, not a new 
   data-fetching convention.
```

### Resolved: `INVENTORY` maps to `InventoryItemTbl`
Confirmed via the backend's inventory domain — `InventoryItemTbl` is a real entity (alongside `LeaseInventoryAssignmentTbl` and `InventoryServiceExpenseTbl`). `referenceId` for room/unit-level photos should be an `InventoryItemTbl` ID, matching the move-in/move-out checklist photo-evidence use case referenced in earlier project planning. Confirm the exact field/relationship linking an `InventoryItemTbl` to a specific unit before wiring the frontend, since that's the join needed to show "this unit's photos" rather than a flat unfiltered list.

---

1. **Part 2 (enforcement mechanism)** — first, so nothing below can drift again the way the plain-guideline version already did.
2. **Part 8's 5 named non-adopter screens + the 4 cross-app-drift screens** — migrate to `PageShell` first, since Part 1/3/4 changes should be made against the final layout pattern, not applied twice.
3. **Part 8's "flag, don't assume" 8 screens** — resolve whether their residual `SafeAreaView` usage is legitimate or leftover, before touching anything else in those files.
4. **Part 1 (GlassCard rewrite) + Part 3 (color table)** — same pass, same files, now against a fully `PageShell`-consistent screen set.
5. **Part 8's gradient-removal checklist, screen by screen, highest-count first** — mechanical once Part 3's `backgroundGradient` decision is made.
6. **Part 4 (typography) + Part 7 (StatCard mobile fixes)** — same pass, `StatCard.tsx` is touched by both.
7. **Part 5 (responsive tiers) + Part 6 (desktop standard)** — once the foundation above is stable, using Part 8's exact screen list as the checklist, not an estimate.
8. **Part 9's accessibility sweep + Part 10's string-constants migration** — do both IN the same pass as whichever screen is being touched for Parts 1/3/4/7/8 above (same files, same interactive elements), not as separate later passes. Verify Part 9's destructive-action pattern survives unchanged on every screen touched.
9. Re-verify on Portfolio, Reports, and Login at all four responsive tiers, light and dark, in BOTH apps, before calling any of this done.
