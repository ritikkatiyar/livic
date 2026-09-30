import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Href, useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { AppTheme } from '@/src/theme/ThemeContext';
import { useScrollNav } from './ScrollContext';
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

interface BottomNavigationProps {
  onMorePress: () => void;
  onQRPress?: () => void;
}

const NAV_ITEMS: { label: string; icon: keyof typeof MaterialIcons.glyphMap; route: string }[] = [
  { label: 'Home', icon: 'home', route: '/tenant-home' },
  { label: 'Payments', icon: 'payments', route: '/tenant-payments' },
  { label: 'Requests', icon: 'build', route: '/tenant-maintenance' },
];

export default function BottomNavigation({ onMorePress }: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = dockBottom(insets.bottom);
  const styles = React.useMemo(() => createStyles(theme, isDark, bottomOffset), [theme, isDark, bottomOffset]);
  const { navTranslateY } = useScrollNav();

  if (pathname === '/ai' || pathname.startsWith('/ai') || pathname === '/ai-assistant') {
    return null;
  }

  const isOn = (route: string) => pathname === route || pathname.startsWith(`${route}/`);
  // Screens reached from the More sheet (property, items, mess menu, settings) light up "More"
  const isMoreActive = !NAV_ITEMS.some((item) => isOn(item.route));

  const renderItem = (key: string, label: string, icon: keyof typeof MaterialIcons.glyphMap, active: boolean, onPress: () => void, accessibilityLabel = label) => (
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
    >
      <View style={styles.pillContainer} accessibilityRole="tablist">
        {NAV_ITEMS.map((item) => {
          const active = isOn(item.route);
          // Tabs replace each other rather than stacking, so Back leaves the app section instead of replaying tab switches
          return renderItem(item.route, item.label, item.icon, active, () => {
            if (!active) router.replace(item.route as Href);
          });
        })}
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
    shadowColor: theme.Surface.shadowColor,
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
