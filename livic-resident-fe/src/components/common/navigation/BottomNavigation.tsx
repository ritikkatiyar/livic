import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Href, useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollNav } from './ScrollContext';
import { ASSISTANT_SIZE, DOCK_GAP, DOCK_SIDE_PADDING, dockBottom } from './bottomDock';
import { TabPill } from './TabPill';

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
  const { navTranslateY } = useScrollNav();

  if (pathname === '/ai' || pathname.startsWith('/ai') || pathname === '/ai-assistant') {
    return null;
  }

  const isOn = (route: string) => pathname === route || pathname.startsWith(`${route}/`);
  // Screens reached from the More sheet (property, items, mess menu, settings) light up "More"
  const isMoreActive = !NAV_ITEMS.some((item) => isOn(item.route));

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
      <TabPill
        items={[
          ...NAV_ITEMS.map((item) => {
            const active = isOn(item.route);
            return {
              key: item.route,
              label: item.label,
              icon: item.icon,
              active,
              // Tabs replace each other rather than stacking, so Back leaves the app section instead of replaying tab switches
              onPress: () => {
                if (!active) router.replace(item.route as Href);
              },
            };
          }),
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
