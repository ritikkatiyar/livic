import React from 'react';
import { View, StyleSheet, Animated, Keyboard, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Href, useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollNav } from './ScrollContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useOpenRequestCount } from '@/src/features/tenant/hooks/useOpenRequestCount';
import { haptic } from '@/src/theme/haptics';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { withAlpha } from '@/src/theme/colorUtils';
import { ASSISTANT_SIZE, DOCK_GAP, DOCK_SIDE_PADDING, PILL_HEIGHT, dockBottom, useLiviInTopBar } from './bottomDock';
import { TabPill, type TabPillItem } from './TabPill';
import { RAIL_WIDTH, TabRail } from './TabRail';
import { useResponsive } from '@/src/hooks/useResponsive';

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
  const insets = useSafeAreaInsets();
  const bottomOffset = dockBottom(insets.bottom);
  const styles = React.useMemo(() => createStyles(bottomOffset), [bottomOffset]);
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
  const { theme } = useAppTheme();
  const { accessToken } = useAuth();
  const openRequests = useOpenRequestCount(accessToken || null);
  const { isTablet } = useResponsive();

  if (pathname === '/ai' || pathname.startsWith('/ai') || pathname === '/ai-assistant') {
    return null;
  }

  const isOn = (route: string) => pathname === route || pathname.startsWith(`${route}/`);
  // Screens reached from the More sheet (property, items, mess menu, settings) light up "More"
  const isMoreActive = !NAV_ITEMS.some((item) => isOn(item.route));

  const tabItems: TabPillItem[] = [
    ...NAV_ITEMS.map((item) => {
      const active = isOn(item.route);
      return {
        key: item.route,
        label: item.label,
        icon: item.icon,
        active,
        // Tabs replace each other rather than stacking, so Back leaves the app section instead of replaying tab switches
        onPress: () => {
          // Already here: scroll back to the top, as both platforms do on re-tap
          if (active) {
            requestScrollToTop();
            return;
          }
          haptic('tap');
          router.replace(item.route as Href);
        },
        badgeCount: item.route === '/tenant-maintenance' ? openRequests : undefined,
        badgeMeaning: 'open',
        // Waiting on the landlord, not on the resident: no red alarm they can't clear
        badgeTone: 'neutral' as const,
      };
    }),
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

  // Tablets: the same tabs as a rail down the left edge, below the top bar and beside the content
  if (isTablet) {
    return (
      <View pointerEvents="box-none" style={[styles.railContainer, { top: 56 + (insets.top > 0 ? insets.top : 12) }]}>
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
