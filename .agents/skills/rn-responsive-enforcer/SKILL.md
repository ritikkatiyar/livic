---
name: rn-responsive-enforcer
description: Strict guidelines for React Native cross-platform responsive design and glassmorphic UI patterns.
---

# React Native Responsive Design & UI Enforcer

This skill enforces the specific responsive layout strategies, screen architectures, and styling paradigms (such as glassmorphism) used throughout the TenantApp React Native frontend.

## 1. Responsive Layout Patterns

### Breakpoint Management
Always use `useWindowDimensions` from `react-native` to determine the viewport width and define the desktop breakpoint exactly at **900px**.

```tsx
const { width } = useWindowDimensions();
const isDesktop = width >= 900;
```

### Screen Shell Architecture & Role-Based Navigation
When building complete screens, layouts must adapt based on both the device breakpoint and the user's role (`tenant`, `super_admin`, `admin`, `propertyStaff`). Use a distinct layout shell for Desktop versus Mobile while respecting role-specific constraints:

- **Desktop (Admin & Staff Roles):** Utilize a Row-based flex layout preferring a sidebar/drawer navigation system. Maximize horizontal space for high data density requirements (e.g., complex tables, grids, expansive metrics). Center the main content area using a `maxWidth` (e.g., `1220px`), and do NOT wrap the main content in a `SafeAreaView`.
- **Desktop (Tenant Role):** While utilizing horizontal space, maintain a cleaner, less dense interface focused on ease of use and distinct tasks.
- **Mobile (Tenant Role):** Utilize a Column-based flex layout wrapped in a `SafeAreaView` from `react-native-safe-area-context`. Navigation should prioritize bottom tabs. The layout should focus on vertical, card-based scrolling.
- **Mobile (Admin & Staff Roles):** Utilize a Column-based flex layout wrapped in a `SafeAreaView`. Prioritize clear stacking of complex actions and metrics without overwhelming the smaller viewport.

### Fluid Dimensions
- Avoid hardcoded fixed pixel widths for primary content containers. Use `flex: 1`, percentages (`width: '100%'`), or flexbox `gap` to create fluid, adaptive layouts.
- Only use fixed widths for standard structural elements like Sidebars (e.g., `width: 260`) or Avatar/Icon containers.

## 2. Styling Paradigms

### Glassmorphism Implementation
Use `BlurView` from `expo-blur` heavily for cards, modals, and metric displays.

**Rules for Glass Elements:**
- Use `tint="light"`.
- Use varying `intensity` (typically between `50` and `70`).
- Wrap the inner content or apply styles directly to the `BlurView`, ensuring you include a subtle semi-transparent white background and border to enhance the frosted glass effect.

```tsx
import { BlurView } from 'expo-blur';

<BlurView 
  intensity={65} 
  tint="light" 
  style={{
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    overflow: 'hidden'
  }}
>
  {/* Content */}
</BlurView>
```

### Gradients
Use `LinearGradient` from `expo-linear-gradient` for primary call-to-action buttons and screen backgrounds.

## 3. Before/After Example

This few-shot example demonstrates how to convert a standard, naive component into one that strictly follows the TenantApp responsive and glassmorphic paradigms.

### ❌ Incorrect (Standard RN styling, ignoring breakpoints)

```tsx
export function PropertyCard({ item }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{item.name}</Text>
      <View style={styles.metrics}>
        <Text>Floors: {item.totalFloors}</Text>
      </View>
      <TouchableOpacity style={styles.button}>
        <Text>Manage</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 20, width: 350 },
  title: { fontSize: 20, fontWeight: 'bold' },
  metrics: { flexDirection: 'row', marginTop: 10 },
  button: { backgroundColor: 'blue', padding: 10, marginTop: 15 }
});
```

### ✅ Correct (Responsive, Glassmorphic, Adaptive)

```tsx
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useWindowDimensions } from 'react-native';

export function PropertyCard({ item, isDesktop }) {
  if (isDesktop) {
    return (
      <BlurView intensity={60} tint="light" style={[styles.card, styles.cardDesktop]}>
        <View style={styles.desktopRow}>
          <View style={styles.contentLeft}>
            <Text style={styles.title}>{item.name}</Text>
          </View>
          <View style={styles.contentRight}>
            <BlurView intensity={65} tint="light" style={styles.metricRow}>
               <Text style={styles.metricLabel}>FLOORS</Text>
               <Text style={styles.metricValue}>{item.totalFloors}</Text>
            </BlurView>
            <TouchableOpacity style={styles.manageButtonWrapper}>
              <LinearGradient colors={['#00d4ff', '#0072ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
                <Text style={styles.buttonText}>MANAGE</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    );
  }

  // Mobile Render
  return (
    <BlurView intensity={60} tint="light" style={[styles.card, styles.cardMobile]}>
      <Text style={styles.title}>{item.name}</Text>
      <View style={styles.metricsMobile}>
        <BlurView intensity={65} tint="light" style={styles.metricRowMobile}>
           <Text style={styles.metricLabel}>FLOORS</Text>
           <Text style={styles.metricValue}>{item.totalFloors}</Text>
        </BlurView>
      </View>
      <TouchableOpacity style={styles.manageButtonWrapperMobile}>
        <LinearGradient colors={['#00d4ff', '#0072ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
          <Text style={styles.buttonText}>Manage Property</Text>
        </LinearGradient>
      </TouchableOpacity>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 24,
    overflow: 'hidden',
    padding: 24,
  },
  cardDesktop: { minHeight: 280, width: '100%' },
  cardMobile: { width: '100%' },
  desktopRow: { flexDirection: 'row', gap: 24 },
  contentLeft: { width: 280 },
  contentRight: { flex: 1, justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '600', color: '#151d1e' },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
  },
  metricLabel: { fontSize: 10, fontWeight: '500', color: '#6b7a7d' },
  metricValue: { fontSize: 13, fontWeight: '600', color: '#151d1e' },
  metricsMobile: { flexDirection: 'row', gap: 10, marginTop: 14 },
  metricRowMobile: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.45)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.65)' },
  manageButtonWrapper: { borderRadius: 16, overflow: 'hidden' },
  manageButtonWrapperMobile: { borderRadius: 16, overflow: 'hidden', marginTop: 16 },
  button: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '600' }
});
```

## 3. Global Typography & Apple HIG Standards

- **Zero Local `fontFamily` Declarations**: Screens and components MUST NEVER declare local `fontFamily` properties (e.g., `fontFamily: 'Inter'`, `fontFamily: 'Playfair Display'`). Every screen inherits the global Apple SF Pro font stack from the root (`+html.tsx` on web, system font on iOS).
- **Prohibited Excessive Boldness**: Weights `'800'` and `'900'` are strictly forbidden. Use `'600'` for titles/metrics/CTAs, `'500'` for labels/badges, and `'400'` for body text.
- **Theme Token Usage**: Typography must resolve through `theme.Typography.*` tokens.
- **Automated Verification**: Enforced via `npm run check:typography` and `TypographyGuardrail.test.ts`.

