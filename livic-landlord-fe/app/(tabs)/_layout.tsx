import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { Tabs } from 'expo-router';
import BottomNavigation from '@/src/components/common/navigation/BottomNavigation';
import MobileHeader from '@/src/components/common/navigation/MobileHeader';
import MobileMoreSheet from '@/src/components/common/navigation/MobileMoreSheet';
import FloatingAIAssistant from '@/src/components/common/navigation/FloatingAIAssistant';
import { AppChromeProvider, useAppChrome } from '@/src/components/common/layout/AppChrome';
import { DesktopLayoutShell } from '@/src/components/common/layout/DesktopLayoutShell';
import { useResponsive } from '@/src/hooks/useResponsive';

// Sections opened from the More sheet (or the desktop sidebar). They are tabs without a
// button: switching to them keeps the four main tabs' state intact.
const MORE_SECTIONS = ['analytics', 'reports', 'announcements', 'mess', 'settings', 'admin'] as const;

export const unstable_settings = { initialRouteName: '(home)' };

/**
 * The signed-in app shell. It owns every piece of chrome — header, bottom bar, assistant
 * bubble and the More sheet — so screens never decide whether to show them, and each tab
 * keeps its own history: switching tabs is instant and Back stays inside the current tab.
 *
 * Screens that must fill the display (login, onboarding, the AI desk) live outside this
 * group in app/, so they get no chrome at all.
 */
function AppShell() {
  const { isDesktop } = useResponsive();
  const { setSlotHeight } = useAppChrome();
  const [moreSheetVisible, setMoreSheetVisible] = useState(false);

  const tabs = (
    // Native: Back from any tab returns to Home. On web the browser's own Back button
    // drives this, so it walks the tabs the person actually visited, like any other site.
    <Tabs
      backBehavior={Platform.OS === 'web' ? 'history' : 'firstRoute'}
      screenOptions={{
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
        animation: 'none',
        sceneStyle: { backgroundColor: 'transparent' },
      }}
      // Desktop uses the sidebar instead of a bottom bar
      tabBar={(props) =>
        isDesktop ? null : <BottomNavigation {...props} onMorePress={() => setMoreSheetVisible(true)} />
      }
    >
      <Tabs.Screen name="(home)" />
      <Tabs.Screen name="(leases)" />
      <Tabs.Screen name="(finance)" />
      <Tabs.Screen name="(alerts)" />
      {MORE_SECTIONS.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );

  if (isDesktop) {
    return <DesktopLayoutShell>{tabs}</DesktopLayoutShell>;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* The header floats over content (absolute on native, fixed on web), so it reports
          its own measured height and screens pad for it via useAppChromeInsets(). */}
      <MobileHeader
        onLayout={(e) => setSlotHeight('header', e.nativeEvent.layout.height)}
      />

      {tabs}

      <FloatingAIAssistant />
      <MobileMoreSheet visible={moreSheetVisible} onClose={() => setMoreSheetVisible(false)} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <AppChromeProvider>
      <AppShell />
    </AppChromeProvider>
  );
}
