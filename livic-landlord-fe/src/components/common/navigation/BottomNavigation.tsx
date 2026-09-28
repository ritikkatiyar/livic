import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { usePermissions } from '@/src/features/auth/hooks/usePermissions';
import { useScrollNav } from './ScrollContext';
import { useAppChrome } from '@/src/components/common/layout/AppChrome';

/** Gap between the floating pill and the bottom of the screen. */
const BOTTOM_BAR_OFFSET = Platform.OS === 'ios' ? 24 : 16;

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
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { canRoute } = usePermissions();
  const { navTranslateY } = useScrollNav();
  const { setSlotHeight } = useAppChrome();

  const focusedTab = state.routes[state.index]?.name;
  const canSeeRentRoll = canRoute('/expenses/rent-roll');
  const navItems: NavTabItem[] = ([
    { id: 'home', label: 'Home', icon: 'apartment', tabName: '(home)', route: '/command-center', initialScreen: 'command-center' },
    { id: 'leases', label: 'Leases', icon: 'receipt-long', tabName: '(leases)', route: '/leases', initialScreen: 'leases' },
    {
      id: 'finance',
      label: 'Finance',
      icon: 'payments',
      tabName: '(finance)',
      route: canSeeRentRoll ? '/expenses/rent-roll' : '/expenses',
      initialScreen: canSeeRentRoll ? 'expenses/rent-roll' : 'expenses/index',
    },
    { id: 'alerts', label: 'Alerts', icon: 'report-problem', tabName: '(alerts)', route: '/escalations', initialScreen: 'escalations' },
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
    if (isFocused || event.defaultPrevented) return;
    if (!route.state && item.initialScreen) {
      navigation.navigate(route.name, { screen: item.initialScreen });
    } else {
      navigation.navigate(route.name);
    }
  };

  return (
    <>
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: `
          .mobile-bottom-nav-container {
            position: fixed !important;
            bottom: 16px !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 9999 !important;
          }
          @media (min-width: 900px) {
            .mobile-bottom-nav-container {
              display: none !important;
            }
          }
        `}} />
      )}
      <Animated.View
        // @ts-ignore
        dataSet={{ bottomNav: 'true', responsiveLayout: 'mobile' }}
        className="mobile-bottom-nav-container"
        style={[
          styles.outerContainer,
          {
            transform: [{ translateY: navTranslateY }],
            opacity: navTranslateY.interpolate({ inputRange: [0, 120], outputRange: [1, 0], extrapolate: 'clamp' }),
          },
        ]}
        pointerEvents="box-none"
        // The bar floats over content: report what it covers so screens can pad for it
        onLayout={(e) => setSlotHeight('tabBar', e.nativeEvent.layout.height + BOTTOM_BAR_OFFSET)}
      >
        <View style={styles.pillContainer}>
          {navItems.map((item) => {
            const active = item.tabName === focusedTab;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.navItem}
                onPress={() => handleTabPress(item)}
                activeOpacity={0.75}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
              >
                <View style={[styles.iconCircle, active && styles.iconCircleActive]}>
                  <MaterialIcons
                    name={item.icon}
                    size={20}
                    color={active ? theme.Colors.primary : theme.Colors.onSurfaceVariant}
                  />
                </View>
                <Text
                  style={[
                    styles.navText,
                    { color: active ? theme.Colors.primary : theme.Colors.onSurfaceVariant },
                    active && styles.navTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* More Drawer Sheet Trigger */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={onMorePress}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityState={{ selected: isMoreActive }}
            accessibilityLabel="More options"
          >
            <View style={[styles.iconCircle, isMoreActive && styles.iconCircleActive]}>
              <MaterialIcons name="grid-view" size={20} color={isMoreActive ? theme.Colors.primary : theme.Colors.onSurfaceVariant} />
            </View>
            <Text
              style={[
                styles.navText,
                { color: isMoreActive ? theme.Colors.primary : theme.Colors.onSurfaceVariant },
                isMoreActive && styles.navTextActive,
              ]}
              numberOfLines={1}
            >
              More
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: BOTTOM_BAR_OFFSET,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    paddingHorizontal: 12,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 32,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    shadowColor: theme.Colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    maxWidth: 440,
    width: '100%',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
    gap: 2,
    minHeight: 44,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: theme.Colors.primaryContainer,
  },
  navText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  navTextActive: {
    fontWeight: '600',
  },
});
