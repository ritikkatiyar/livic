import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { AppTheme } from '@/src/theme/ThemeContext';
import { usePermissions } from '@/src/features/auth/hooks/usePermissions';
import { useScrollNav } from './ScrollContext';
import { useAppChrome } from '@/src/components/common/layout/AppChrome';
import {
  ASSISTANT_SIZE,
  DOCK_GAP,
  DOCK_SIDE_PADDING,
  dockBottom,
  PILL_BORDER,
  PILL_HEIGHT,
  PILL_ITEM_HEIGHT,
  PILL_MAX_WIDTH,
  PILL_PADDING,
} from './bottomDock';

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
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = dockBottom(insets.bottom);
  const styles = React.useMemo(() => createStyles(theme, isDark, bottomOffset), [theme, isDark, bottomOffset]);
  const { canRoute } = usePermissions();
  const { navTranslateY } = useScrollNav();
  const { setSlotHeight } = useAppChrome();

  const focusedTab = state.routes[state.index]?.name;
  const canSeeRentRoll = canRoute('/expenses/rent-roll');
  const navItems: NavTabItem[] = ([
    { id: 'portfolio', label: 'Portfolio', icon: 'apartment', tabName: '(home)', route: '/command-center', initialScreen: 'command-center' },
    { id: 'leases', label: 'Leases', icon: 'receipt-long', tabName: '(leases)', route: '/leases', initialScreen: 'leases' },
    {
      id: 'finance',
      label: 'Finance',
      icon: 'payments',
      tabName: '(finance)',
      route: canSeeRentRoll ? '/expenses/rent-roll' : '/expenses',
      initialScreen: canSeeRentRoll ? 'expenses/rent-roll' : 'expenses/index',
    },
    { id: 'issues', label: 'Issues', icon: 'inbox', tabName: '(alerts)', route: '/escalations', initialScreen: 'escalations' },
  ] satisfies NavTabItem[]).filter((item) => canRoute(item.route));

  // More sections (analytics, settings...) are tabs without a button: highlight "More" for them
  const isMoreActive = !navItems.some((item) => item.tabName === focusedTab);

  const handleTabPress = (item: NavTabItem) => {
    const route = state.routes.find((r) => r.name === item.tabName);
    if (!route) return;
    const isFocused = route.name === focusedTab;
    // Emitting tabPress lets the tab's stack pop back to its first screen when the focused
    // tab is tapped again (e.g. Portfolio while on a property's floor editor).
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (isFocused || event.defaultPrevented) return;
    if (!route.state && item.initialScreen) {
      navigation.navigate(route.name, { screen: item.initialScreen });
    } else {
      navigation.navigate(route.name);
    }
  };

  const renderItem = (key: string, label: string, icon: NavTabItem['icon'], active: boolean, onPress: () => void, accessibilityLabel = label) => (
    <TouchableOpacity
      key={key}
      style={[styles.navItem, active && styles.navItemActive]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="tab"
      aria-selected={active}
      accessibilityLabel={accessibilityLabel}
    >
      <MaterialIcons name={icon} size={20} color={active ? theme.Colors.onPrimary : theme.Colors.onSurfaceVariant} />
      <Text style={[styles.navText, active && styles.navTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View
      // @ts-ignore react-native-web forwards dataSet to data-* attributes; app/+html.tsx pins and hides the bar by them
      dataSet={{ bottomNav: 'true', responsiveLayout: 'mobile' }}
      style={[
        styles.outerContainer,
        {
          transform: [{ translateY: navTranslateY }],
          opacity: navTranslateY.interpolate({ inputRange: [0, 120], outputRange: [1, 0], extrapolate: 'clamp' }),
        },
      ]}
      pointerEvents="box-none"
      // The bar floats over content (Livi sits beside it): report what it covers so screens can pad for it
      onLayout={(e) => setSlotHeight('tabBar', e.nativeEvent.layout.height + bottomOffset)}
    >
      <View style={styles.pillContainer} accessibilityRole="tablist">
        {navItems.map((item) =>
          renderItem(item.id, item.label, item.icon, item.tabName === focusedTab, () => handleTabPress(item)),
        )}
        {renderItem('more', 'More', 'grid-view', isMoreActive, onMorePress, 'More options')}
      </View>
      {/* Livi's bubble is drawn by FloatingAIAssistant; this keeps its place in the row */}
      <View style={styles.assistantSlot} pointerEvents="none" />
    </Animated.View>
  );
}

const createStyles = (theme: AppTheme, isDark: boolean, bottomOffset: number) => StyleSheet.create({
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
  pillContainer: {
    flex: 1,
    maxWidth: PILL_MAX_WIDTH,
    height: PILL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    padding: PILL_PADDING,
    gap: 2,
    borderRadius: PILL_HEIGHT / 2,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    // A hairline only in dark mode, where a shadow can't lift the bar off the page
    borderWidth: PILL_BORDER,
    borderColor: isDark ? theme.Colors.outlineVariant : 'transparent',
    shadowColor: theme.Colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.4 : 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  assistantSlot: {
    width: ASSISTANT_SIZE,
    height: ASSISTANT_SIZE,
  },
  navItem: {
    flex: 1,
    height: PILL_ITEM_HEIGHT,
    // Concentric with the pill: its radius minus the inset around the capsule
    borderRadius: PILL_ITEM_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  navItemActive: {
    backgroundColor: theme.Colors.primary,
  },
  navText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '500',
    letterSpacing: 0.1,
    color: theme.Colors.onSurfaceVariant,
  },
  navTextActive: {
    fontWeight: '600',
    color: theme.Colors.onPrimary,
  },
});
