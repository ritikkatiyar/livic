# UX/UI Consistency Standards: Livic Frontend (React Native & Expo)

This workspace rule file defines the strict design architecture, styling guidelines, and UX patterns required to maintain a premium, high-fidelity user interface across **Livic Landlord** (`livic-landlord-fe`) and **Livic Resident** (`livic-resident-fe`), the mobile (Play Store) and web (Vercel) applications. All frontend developments, refactorings, and feature additions must strictly adhere to these specifications.

> **Note:** This document predates the Livic rebrand and the addition of dark mode. Section 1's color values below describe the **light-mode** token values as historical reference — they must be consumed via `useAppTheme()` tokens from `src/theme/Theme.ts` (which now defines both `LightColors` and `DarkColors`), never hardcoded directly. A hardcoded hex value cannot adapt when the user switches theme mode and is the direct cause of dark-mode contrast bugs found in the current codebase. See Section 6 for the full enforceable rule set added after the dark-mode audit.

---

## 1. Core Design Tokens & Theme Integration

The project utilizes a centralized theme structure defined in `src/theme/Theme.ts` (light + dark palettes) and consumed via `useAppTheme()` from `src/theme/ThemeContext.tsx`. Direct inline hex codes, arbitrary sizes, or unmapped font-families are strictly prohibited — reference the matching token, never the literal value below.

### A. Color Palette Rules (light-mode token values shown for reference — always consume via `theme.Colors.<token>`, which resolves correctly per mode)
- **Primary Color (`theme.Colors.primary`, light value `#006875`)**: Used for branding, dominant UI elements, active icons, and primary category headings.
- **Secondary Color (`theme.Colors.secondary`, light value `#4648d4`)**: Reserved for primary action buttons, save endpoints, and focal interactive elements.
- **Tertiary Color (`theme.Colors.tertiary`, light value `#765a00`)**: Used selectively for warning states, pending actions, and highlights.
- **Error Colors (`theme.Colors.error` / `theme.Colors.errorContainer`, light values `#ba1a1a` / `#ffdad6`)**: Used exclusively for destructive actions, validation errors, and critical alerts.
- **Background Gradient**: All full-screen screens must render inside a standard page wrapper utilizing the `backgroundGradient`: `["#d4f5f9", "#e8f8fb", "#e2e0fb"]` (luminous cyan, ice blue, and pastel lavender). All gradient instances must be configured as diagonal (start=`{ x: 0, y: 0 }`, end=`{ x: 1, y: 1 }`) rather than vertical or default.
- **Accent Gradients**: Key visual triggers (active segment selections, call-to-action buttons) must use `accentGradientStart` (`#00e0ff`) to `accentGradientEnd` (`#0070ea`).

### B. Typography Hierarchy (Apple Human Interface Guidelines)
All text components MUST consume predefined typography tokens from `theme.Typography.*` (`useAppTheme()`). Individual screens and components are strictly prohibited from declaring local `fontFamily` or overriding font styles. The global font stack is Apple's San Francisco SF Pro (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif` on web, `System` on iOS).

Heavy shouting weights (`800` and `900`) and serif fonts (`Playfair Display`, `Georgia`) are strictly banned across the entire codebase.

| Token | Family | Size | Weight | Line Height | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `displayLarge` / `headlineXl` | Apple SF Pro (System) | 40px - 48px | 600 (Semibold) | 48px - 56px | Screen title & hero headline headers |
| `displayMetrics` | Apple SF Pro (System) | 40px | 600 (Semibold) | 48px | Large layout display figures |
| `headlineLarge` / `headlineMedium` | Apple SF Pro (System) | 24px - 28px | 600 (Semibold) | 32px - 36px | Section headers |
| `titleLarge` / `titleMedium` | Apple SF Pro (System) | 16px - 18px | 600 (Semibold) / 500 (Medium) | 24px | Card titles & sub-headers |
| `bodyLarge` | Apple SF Pro (System) | 16px | 400 (Regular) | 24px | Interactive body / readable text |
| `bodyMedium` / `bodySmall` | Apple SF Pro (System) | 12px - 14px | 400 (Regular) | 16px - 20px | Standard paragraphs & descriptions |
| `labelLarge` / `labelMedium` | Apple SF Pro (System) | 12px - 14px | 500 (Medium) | 16px - 20px | Field labels, control text |
| `labelSmall` | Apple SF Pro (System) | 11px | 500 (Medium) | 16px | Badges, tags, status pills |

### C. Spacing & Borders
- **Spacing Unit (`Spacing.unit = 8`)**: Margins, paddings, and gap configurations must be multiples of 8 (`stackSm` = 8px, `stackMd` = 16px, `containerPadding` = 20px, `stackLg` = 32px).
- **Rounding Tokens (`Rounded`)**:
  - `sm` (4px): Small badges, mini overlays.
  - `default` (8px): Action tags, secondary buttons.
  - `md` (12px): Standard form inputs, segmented pill-containers.
  - `lg` (16px): Content containers, action modals.
  - `xl` (24px): Primary feature cards, bottom sheets.
  - `full` (9999px): Circle buttons, pill segments.

---

## 2. Component Design & Structural Patterns

### A. Glassmorphic Cards (The "Glass" Container)
Cards and form wrappers must implement a cohesive glassmorphic look using `expo-blur`.
```tsx
import { BlurView } from 'expo-blur';
import { Colors, Rounded } from '@/src/theme/Theme';

// Rule: Ensure BlurView is configured with intensity=40 and tint="light"
<BlurView intensity={40} tint="light" style={styles.card}>
  {/* Content */}
</BlurView>

// Accompanying Styles
const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: Rounded.xl,
    padding: Spacing.containerPadding,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    // Soft shadow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 3,
  }
});
```

### B. Form Fields & Input Standards
Inputs must reside inside stylized containers to maintain structural consistency:
1. **Container**: Soft white background `rgba(255, 255, 255, 0.6)`, high-transparency white borders `rgba(255, 255, 255, 0.9)`, border radius `12px` (`Rounded.md`), padding matching standard inputs.
2. **Text Input**: Font style matching body copy, placeholder text styled using `#849495`.
3. **Prefix / Suffix**: Icons (e.g. search, user, currency symbols like ₹) must be consistently aligned in the row layout.
4. **Validation States**: Fail state overlays must transition borders to `Colors.error` (`#ba1a1a`) and present immediate warning sub-labels.

### C. Segment & Toggle Controls
Segmented options (e.g. Billing Frequency, Categories, Recipient Scope, Severity) must be presented inside a unified, long glassmorphic bar containing options as segments.
1. **Container**: Flex row layout, background `rgba(255, 255, 255, 0.6)`, border width `1`, border color `rgba(255, 255, 255, 0.9)`, border radius `12px`, with `padding: 4`.
2. **Segment Button Wrapper**: Equal spacing using `flex: 1`.
3. **Active state (Gradient Pill)**: LinearGradient mapping from `#00d4ff` (cyan) to `#0072ff` (blue) with white bold text, and a border radius of `8px`.
4. **Inactive state**: Solid transparent background with `#151d1e` text color (or specific status color), transitioning opacity on touch.

### D. Pills & Chip Option Lists
When dynamic lists of options (e.g. many properties) cannot fit inside a standard segment bar:
1. **Container**: Always wrap lists in a horizontal `<ScrollView>` using `contentContainerStyle` with `paddingVertical: 6` to avoid clipping borders.
2. **Spacing**: Apply `gap: 10` or `marginRight: 10` between chips.
3. **Chip Sizing & Padding**: Use `paddingVertical: 10` and `paddingHorizontal: 20` with a `borderRadius: 24` (or `Rounded.full`).
4. **Pill Colors**:
   - **Active state**: Solid primary accent blue background (`#0072ff`) with white text (`#ffffff`).
   - **Inactive state**: Semi-translucent white background (`rgba(255, 255, 255, 0.4)`) with standard border (`rgba(255, 255, 255, 0.8)`) and muted text color (`#6b7a7d`).

### E. Primary Action & Gradient Buttons
Primary actions and action triggers must use a unified gradient styling and sizing standard:
1. **Linear Gradient**: Must utilize colors from `#00d4ff` (cyan) to `#0072ff` (blue), starting at `(0,0)` and ending at `(1,0)`.
2. **Typography**: Text must be bold/extra-bold (`fontWeight: '700'` or `'800'`), colored white (`#ffffff`).
3. **Primary / Large Action Buttons** (e.g. Save Layout, Save Changes, Create Property):
   - **Mobile Viewports (Form-bottom/floating actions)**:
     - **Height**: Standardized to exactly **56px** (for thumb touch ergonomics).
     - **Corner Radius**: Fully pill-rounded using `borderRadius: 28` (or `borderRadius: 100`).
     - **Text Size**: `14px` - `16px`.
     - **Shadow**: `shadowColor: '#0072ff'`, `shadowOpacity: 0.25`, `shadowRadius: 10`, `shadowOffset: { width: 0, height: 6 }`, `elevation: 4`.
   - **Desktop Viewports (Page-header row actions)**:
     - **Height**: Standardized to exactly **46px** (for visual balance in web page headers).
     - **Corner Radius**: Fully pill-rounded using `borderRadius: 23` (or `borderRadius: 100`).
     - **Text Size**: `13px` - `14px`.
     - **Shadow**: `shadowColor: '#0072ff'`, `shadowOpacity: 0.18`, `shadowRadius: 6`, `shadowOffset: { width: 0, height: 3 }`, `elevation: 2`.
4. **Compact / Header Action Buttons** (e.g. "Add New", "Add Property" in list section header rows):
   - **Height / Padding**: Standardized to exactly **38px** (using `paddingVertical: 10`, `paddingHorizontal: 18` or `height: 38` with centered flex content).
   - **Corner Radius**: Fully pill-rounded using `borderRadius: 19` (or `borderRadius: 100`).
   - **Text Size**: `12px`.
   - **Shadow**: `shadowColor: '#0072ff'`, `shadowOpacity: 0.18`, `shadowRadius: 6`, `shadowOffset: { width: 0, height: 3 }`, `elevation: 2`.
5. **Layout**: Flex direction row with items centered and a gap of `6` - `8` for aligning icons (e.g. plus signs, checkmarks) alongside the text label.

---

### F. Modal Overlays & Selection Modals
Modal popup cards and configuration overlays must align with the premium styling of the application:
1. **Background Gradient**: Instead of using solid light backgrounds, modal card containers must utilize the standard diagonal background gradient colors: `colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}`, starting at `(0,0)` and ending at `(1,1)`.
2. **Rounded Borders**: To ensure the gradient color background does not overlap card corners, configure the styling using `borderRadius: 24` paired with `overflow: 'hidden'`.
3. **Overlay Backdrop**: The background overlay behind the modal must use a `BlurView` with `intensity: 40` and `tint: "dark"` to draw focus to the foreground modal card.
4. **Action Hierarchy**: Destructive actions (like "Discard Unit" or "Delete") must be styled with a light-red background (`rgba(229, 57, 53, 0.08)`) and matching red text (`#e53935`), placed at the bottom of the card content.

---

## 3. Responsive Screen & Layout Architecture

The app is deployed across mobile (Play Store), and web (Vercel) for both Livic Landlord and Livic Resident. Viewports must adapt using the shared `useResponsive()` hook (`hooks/useResponsive.ts`) — never an inline breakpoint literal in a screen file. The hook exposes `isMobile` (< 768px), `isTablet` (768-1024px), and `isDesktop` (>= 1024px); breakpoint constants live once in `Theme.ts` (`Breakpoints.tablet`, `Breakpoints.desktop`).

### A. Desktop Layout Standards
- **Width Management**: Main panels should have constrained reading boundaries or dual-column structures.
- **Side Panels**: Multi-pane layout editors must display sidebars on the right-hand side (e.g., width set to `380px` - `420px`) rather than using screen overlays.
- **Branding Alignment**: Branding elements (Sidebars, Logo tags, footers) must use `Livic Landlord` across landlord admin/manager screens, and `Livic Resident` across resident-facing interfaces.
- **Action Button Placement**: Primary actions (e.g. "Save Changes", "Broadcast Now", "Create Property") must reside in the top-right of the page header row on desktop (in a `pageHeaderRow` flex row layout), rather than inside the form container cards themselves.
- **Grid Editors**: Canvas workspaces must configure zoom capabilities (scroll wheel bindings) and support click-and-drag grid selection logic.

### B. Mobile Layout Standards
- **Bottom Sheets**: When presenting side content or forms on mobile, wrap them inside dynamic, slide-up bottom sheets (`FadeInUp` / `FadeOutDown` or gesture-driven panels).
- **Virtual Keyboard Deficits**: All interactive mobile forms must programmatically handle keyboard offset adjustments. Set custom listeners to calculate active height offsets:
  ```tsx
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  ```
- **Safe Areas**: Direct layouts must respect notch overlays using `SafeAreaView` from `react-native-safe-area-context` with configured edges (e.g. `edges={['top']}`).

### C. Standard Header & Navigation Bars
To maintain consistent vertical rhythm and screen transitions, all mobile and compact header blocks must align to these metrics:
1. **Paddings**:
   - **Horizontal Padding**: Must be exactly **24px** (matching container grid edges).
   - **Vertical Padding**: Standardized to `paddingTop: 16px` and `paddingBottom: 16px` (or `paddingVertical: 16px`), aligning elements precisely inside the Safe Area boundary.
2. **Back Button**:
   - Must use a fully rounded background circle: `width: 40`, `height: 40`, `borderRadius: 20`, `backgroundColor: 'rgba(255,255,255,0.5)'`, and `justifyContent: 'center'`, `alignItems: 'center'`.
   - **No vertical margins (e.g., `marginBottom: 16`)**: Center the back button vertically in the header row alongside titles to avoid baseline alignment shifts.
   - Font size: `22px` (`fontWeight: '800'`), layout element centered or placed beside the back button in a row container.

### D. Desktop Top Navigation
All desktop-level screens must utilize the globally shared `<DesktopNavBar>` component for their top header instead of building custom inline `BlurView` topbars.
1. **Import Path**: `@/src/components/common/navigation/DesktopNavBar`
2. **Usage**: Pass in `activeTab` to highlight the current section (e.g., `activeTab="Properties"`), `onBack` (optional) to trigger the back action with `backText` (e.g., `backText="Back to Portfolio"`), and `rightContent` to inject custom elements like search boxes or settings icons.
3. **Consistency**: Do not wrap `DesktopNavBar` inside a scrolling container; it must be pinned to the top of the `desktopMain` layout to act as a constant component without re-rendering the page during interactions.

---

## 4. Native Interactions & Polish

### A. Feedback loop & Haptics
- **Tactile feedback**: Integrate `expo-haptics` on major user actions (successful creations, layout validations, modal triggers).
- **Loading states**: Buttons triggering API operations must render inline spinners (`ActivityIndicator` styled using theme colors) and transition to an inactive opacity of `0.7` to prevent double execution.

### B. Header & Scroll Synchronization
- **Interpolated Headers**: Compact top headers must animate opacity dynamically relative to view offsets, transitioning titles as large scroll banners collapse.
  ```tsx
  const headerOpacity = scrollY.interpolate({
    inputRange: [40, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  ```

---

## 5. Implementation & Code Quality Rules

1. **No Commented Code**: Ensure clean files free of unused, legacy styling definitions.
2. **StyleSheet Encapsulation**: All component styling must be defined in a dedicated `const styles = StyleSheet.create({...})` block at the bottom of the file. No inline styles are permitted for complex properties like layout grid settings, flex containers, or border metrics.
3. **No Unused Imports**: Strip unused React Native components, icons, or router references prior to committing.
4. **SVG and Icon Consistency**: Leverage icons exclusively from `@expo/vector-icons` (`MaterialIcons`, `Feather`, `MaterialCommunityIcons`, `Ionicons`) configured with unified sizes (typically `20` / `24` pixels) matching category headers.

### F. Filter Rows & Header Layouts

- **Filter Rows (`desktopFilterRow`)**: When rendering a filter row above a grid of smaller cards (e.g., unit cards), do NOT wrap the filter row in a bordered glassmorphic card container. Render it transparently (`flexDirection: 'row'`, `alignItems: 'flex-end'`, `gap: 24`, `marginBottom: 32`) without background colors or borders. This prevents the filter row from appearing visually unbalanced ("longer" or wider) compared to the individual small cards below it.

---

## 6. Enforceable Rules (added after the theme/dark-mode audit — PR-review agent must check these)

These rules were added after an audit found the codebase deviates from Sections 1-5 above in ways the review agent had not been catching (partly because Section F above was corrupted/unparseable until this fix). Treat these as equally binding.

### A. Theme Token Compliance
- No screen or component file may hardcode a hex color literal (`'#...'`) or a numeric `fontSize` value outside `src/theme/Theme.ts`. All colors and typography must resolve through `useAppTheme()` tokens.
- Every color used in a screen must work correctly against **both** `LightColors` and `DarkColors` in `Theme.ts`. A value that only reads correctly in one mode is a defect, not a style choice — flag it.

### B. Single Breakpoint Source
- All desktop/tablet/mobile checks must use the shared `useResponsive()` hook. Flag any inline `width >= <number>` (or equivalent `Dimensions.get('window').width` comparison) found outside that hook.

### C. No Duplicate Data-Fetching
- Any component fetching shared/global data (e.g. the properties list, a tenant list) must consume it via the app's shared query hook (React Query), not a local `useState` + `useEffect` + fetch reimplementation. Flag new local re-fetching of data another screen already fetches through an existing hook.

### D. Primary Navigation Chrome Restraint
- Bottom navigation bars and floating action buttons (FABs) may use at most a 2-color gradient drawn from the existing brand palette (`primary`/`secondary`/`accentGradientStart`/`accentGradientEnd`). Multi-hue "rainbow" gradients (3+ unrelated hues), glow/halo shadow effects, and playful iconography (sparkles, stars, bursts) are prohibited on primary navigation elements. This is a landlord/resident-facing product, not a consumer novelty app — reserve expressive visuals for onboarding/empty-state illustrations only.

### E. Loading State Consistency
- Any screen loading more than a single data point must use the shared `<Skeleton>` primitive rather than a bare `ActivityIndicator`, once that primitive is available in `src/components/common/feedback/`.

### F. Navigation Consolidation, Search Placement & Pagination Rules
- **DesktopNavBar Baseline Controls**: `DesktopNavBar` must unconditionally render a uniform baseline set of right-side controls (notification bell with active escalation unread badge, and profile avatar). Theme toggles must NOT be rendered in `DesktopNavBar` (they reside only in `SidebarNavigation` or `MobileMoreSheet`).
- **Search Placement Rule**: Global / cross-cutting portfolio search belongs in `DesktopNavBar`'s global search slot. Contextual / page-scoped list search belongs inline in that page's content near the list it filters.
- **Pagination Rule**: All index lists displaying dynamic database items (Properties, Leases, Statements, Announcements, Escalations, Inventory, Analytics cards) must implement pagination using the shared `<Pagination>` UI component and `usePaginatedQuery` helper hook, limiting pages to 20 items per page (or 4-6 items per widget card) to maintain vertical screen layout balance.

