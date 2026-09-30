import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePermissions } from '@/src/features/auth/hooks/usePermissions';
import { useScrollNav } from './ScrollContext';
import { useAppChrome } from '@/src/components/common/layout/AppChrome';
import { ASSISTANT_SIZE, DOCK_GAP, DOCK_SIDE_PADDING, dockBottom } from './bottomDock';
import { TabPill } from './TabPill';

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
      <TabPill
        items={[
          ...navItems.map((item) => ({
            key: item.id,
            label: item.label,
            icon: item.icon,
            active: item.tabName === focusedTab,
            onPress: () => handleTabPress(item),
          })),
          { key: 'more', label: 'More', icon: 'grid-view', active: isMoreActive, onPress: onMorePress, accessibilityLabel: 'More options' },
        ]}
      />
      {/* Livi's bubble is drawn by FloatingAIAssistant; this keeps its place in the row */}
      <View style={styles.assistantSlot} pointerEvents="none" />
    </Animated.View>
  );
}

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
  assistantSlot: {
    width: ASSISTANT_SIZE,
    height: ASSISTANT_SIZE,
  },
});
