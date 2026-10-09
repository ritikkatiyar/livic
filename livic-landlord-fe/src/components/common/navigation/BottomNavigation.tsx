import React from 'react';
import { View, StyleSheet, Animated, Keyboard, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useIssueAttention } from '@/src/features/issues/hooks/useIssueAttention';
import { haptic } from '@/src/theme/haptics';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { withAlpha } from '@/src/theme/colorUtils';
import { usePermissions } from '@/src/features/auth/hooks/usePermissions';
import { useScrollNav } from './ScrollContext';
import { useAppChrome } from '@/src/components/common/layout/AppChrome';
import { ASSISTANT_SIZE, DOCK_GAP, DOCK_SIDE_PADDING, PILL_HEIGHT, dockBottom, useLiviInTopBar } from './bottomDock';
import { TabPill, type TabPillItem } from './TabPill';
import { RAIL_WIDTH, TabRail } from './TabRail';
import { useResponsive } from '@/src/hooks/useResponsive';

interface BottomNavigationProps extends BottomTabBarProps {
  onMorePress: () => void;
}

interface NavTabItem {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  /** Tab route name in app/(tabs)/_layout.tsx */
  tabName: string;
  /** URL used for the permission check */
  route: string;
  /** Screen to open the first time the tab is visited. A group otherwise opens its
   * alphabetically-first route, which is rarely the one the tab is named after. */
  initialScreen?: string;
}

/** Custom tab bar for the Tabs navigator in app/(tabs)/_layout.tsx (mobile only). */
export default function BottomNavigation({ state, navigation, onMorePress }: BottomNavigationProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = dockBottom(insets.bottom);
  const styles = React.useMemo(() => createStyles(bottomOffset), [bottomOffset]);
  const { canRoute } = usePermissions();
  const { navTranslateY, requestScrollToTop } = useScrollNav();
  const liviInTopBar = useLiviInTopBar();
  // The bar would otherwise ride up on the keyboard and cover the field being typed in
  const [keyboardOpen, setKeyboardOpen] = React.useState(false);
  React.useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const { setSlotHeight, insets: chromeInsets } = useAppChrome();
  const { isTablet } = useResponsive();
  // The rail reports its width (pages pad for it); the bar's height is reported by its own onLayout
  React.useEffect(() => {
    setSlotHeight('rail', isTablet ? RAIL_WIDTH : 0);
    if (isTablet) setSlotHeight('tabBar', 0);
  }, [isTablet, setSlotHeight]);
  const { theme } = useAppTheme();
  const { accessToken } = useAuth();
  const { attention: issueCount } = useIssueAttention(accessToken);

  const focusedTab = state.routes[state.index]?.name;
  const navItems: NavTabItem[] = ([
    // "Home", not "Portfolio": the longest label set the width every tab had to fit, and was cut off on
    // 360dp phones with larger text. The page it opens is titled "My Properties".
    { id: 'portfolio', label: 'Home', icon: 'apartment', tabName: '(home)', route: '/command-center', initialScreen: 'command-center' },
    { id: 'leases', label: 'Leases', icon: 'vpn-key', tabName: '(leases)', route: '/leases', initialScreen: 'leases' },
    {
      id: 'finance',
      label: 'Finance',
      icon: 'payments',
      tabName: '(finance)',
      // The billing pipeline is Finance's home: it is the stack's first screen, so tapping the
      // tab again pops back to the same page it opens on (rent roll is one step on it)
      route: '/expenses',
      initialScreen: 'expenses/index',
    },
    { id: 'issues', label: 'Issues', icon: 'build', tabName: '(alerts)', route: '/escalations', initialScreen: 'escalations' },
  ] satisfies NavTabItem[]).filter((item) => canRoute(item.route));

  // More sections (analytics, settings...) are tabs without a button: highlight "More" for them
  const isMoreActive = !navItems.some((item) => item.tabName === focusedTab);

  const handleTabPress = (item: NavTabItem) => {
    const route = state.routes.find((r) => r.name === item.tabName);
    if (!route) return;
    const isFocused = route.name === focusedTab;
    // Emitting tabPress lets the tab's stack pop back to its first screen when the focused
    // tab is tapped again (e.g. Home while on a property's floor editor).
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (isFocused) {
      // Already here: the stack pops to its home (above), and the screen scrolls back to the top
      if (!event.defaultPrevented) requestScrollToTop();
      return;
    }
    if (event.defaultPrevented) return;
    haptic('tap');
    if (!route.state && item.initialScreen) {
      navigation.navigate(route.name, { screen: item.initialScreen });
    } else {
      navigation.navigate(route.name);
    }
  };

  const tabItems: TabPillItem[] = [
    ...navItems.map((item) => ({
      key: item.id,
      label: item.label,
      icon: item.icon,
      active: item.tabName === focusedTab,
      onPress: () => handleTabPress(item),
      badgeCount: item.id === 'issues' ? issueCount : undefined,
    })),
    {
      key: 'more',
      label: 'More',
      icon: 'grid-view',
      active: isMoreActive,
      onPress: () => {
        haptic('tap');
        onMorePress();
      },
      accessibilityLabel: 'More options',
    },
  ];

  // Tablets: the same tabs as a rail down the left edge, beside the content rather than over it
  if (isTablet) {
    return (
      <View pointerEvents="box-none" style={[styles.railContainer, { top: chromeInsets.top }]}>
        <TabRail items={tabItems} />
      </View>
    );
  }

  return (
    <Animated.View
      // @ts-ignore react-native-web forwards dataSet to data-* attributes; app/+html.tsx pins and hides the bar by them
      dataSet={{ bottomNav: 'true', responsiveLayout: 'mobile' }}
      style={[
        styles.outerContainer,
        keyboardOpen && styles.hidden,
        {
          transform: [{ translateY: navTranslateY }],
          opacity: navTranslateY.interpolate({ inputRange: [0, 120], outputRange: [1, 0], extrapolate: 'clamp' }),
        },
      ]}
      pointerEvents="box-none"
      // The bar floats over content (Livi sits beside it): report what it covers so screens can pad for it
      onLayout={(e) => setSlotHeight('tabBar', e.nativeEvent.layout.height + bottomOffset)}
    >
      {/* Fades the page out behind the floating bar, so content never peeks out underneath it */}
      <LinearGradient
        pointerEvents="none"
        colors={[withAlpha(theme.Colors.background, 0), theme.Colors.background, theme.Colors.background]}
        locations={[0, 0.5, 1]}
        style={[styles.fade, { bottom: -bottomOffset, height: PILL_HEIGHT + bottomOffset + FADE_EXTRA }]}
      />
      <TabPill items={tabItems} />
      {/* Livi's bubble is drawn by FloatingAIAssistant; this keeps its place in the row, unless Livi
          has moved to the top bar to give the tabs the whole width */}
      {!liviInTopBar && <View style={styles.assistantSlot} pointerEvents="none" />}
    </Animated.View>
  );
}

// How far above the bar the fade begins
const FADE_EXTRA = 24;

const createStyles = (bottomOffset: number) => StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: bottomOffset,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DOCK_GAP,
    zIndex: 1000,
    paddingHorizontal: DOCK_SIDE_PADDING,
  },
  railContainer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: RAIL_WIDTH,
    zIndex: 1000,
  },
  hidden: {
    display: 'none',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: -1,
  },
  assistantSlot: {
    width: ASSISTANT_SIZE,
    height: ASSISTANT_SIZE,
  },
});
