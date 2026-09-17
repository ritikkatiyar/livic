import React, { useEffect, useState, useMemo } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from 'react-native';
import { AuthProvider } from '@/src/features/auth/context/AuthProvider';
import { ThemeContextProvider } from '@/src/theme/ThemeContext';
import BottomNavigation from '@/src/components/common/navigation/BottomNavigation';
import SidebarNavigation from '@/src/components/common/navigation/SidebarNavigation';
import MobileHeader from '@/src/components/common/navigation/MobileHeader';
import MobileMoreSheet from '@/src/components/common/navigation/MobileMoreSheet';
import QRScannerModal from '@/src/components/common/navigation/QRScannerModal';
import FloatingAIAssistant from '@/src/components/common/navigation/FloatingAIAssistant';
import { ScrollProvider } from '@/src/components/common/navigation/ScrollContext';
import { ScreenWrapper } from '@/src/components/common/layout/ScreenWrapper';
import { OnboardingGate } from '@/src/components/common/layout/OnboardingGate';
import { useResponsive } from '@/src/hooks/useResponsive';
import { ToastProvider } from '@/src/components/common/feedback/ToastContext';
import ErrorBoundary from '@/src/components/common/feedback/ErrorBoundary';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useProperties } from '@/src/hooks/useProperties';
import { LinearGradient, type LinearGradientProps } from 'expo-linear-gradient';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { LightColors, Breakpoints, Spacing, Rounded, Timing } from '@/src/theme/Theme';

const ROUTE_TITLES: Record<string, string> = {
  '/command-center': 'Portfolio',
  '/leases': 'Leases',
  '/inventory': 'Items',
  '/expenses': 'Finance',
  '/expenses/charge-config': 'Charges',
  '/expenses/billing-worksheet': 'Worksheets',
  '/expenses/ledger': 'Ledger',
  '/expenses/rent-roll': 'Rent Roll',
  '/create-expense': 'New Charge',
  '/reports': 'Reports',
  '/ai': 'AI Desk',
  '/escalations': 'Escalations',
  '/announcements': 'Announcements',
  '/analytics': 'Overview',
  '/settings': 'Settings',
  '/admin': 'Admin',
  '/billing': 'Subscription',
  '/properties/create': 'New Property',
};

const PRIMARY_ROUTES = [
  '/command-center',
  '/leases',
  '/inventory',
  '/expenses',
  '/analytics',
  '/reports',
  '/ai',
  '/announcements',
  '/escalations',
  '/settings',
  '/'
];

function getMobileHeaderTitle(pathname: string): string {
  const clean = pathname.split('?')[0];
  if (ROUTE_TITLES[clean]) {
    return ROUTE_TITLES[clean];
  }
  if (clean.startsWith('/properties/')) {
    if (clean.includes('/floors')) {
      return 'Floor View';
    }
    if (clean.includes('/meter-readings')) {
      return 'Meter Readings';
    }
    if (clean.includes('/memberships')) {
      return 'Members';
    }
    return 'Property Details';
  }
  if (clean.startsWith('/expenses/')) {
    return 'Finance';
  }
  return 'Livic';
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

import { PropertySelectionProvider, useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { AdminTutorialProvider } from '@/src/features/onboarding/context/AdminTutorialContext';

type LinearGradientWithWebProps = LinearGradientProps & {
  dataSet?: Record<string, string | number | boolean | undefined>;
};
const LinearGradientWithDataSet = LinearGradient as React.ComponentType<LinearGradientWithWebProps>;

function DesktopLayoutShell({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();
  const pathname = usePathname();
  const { properties } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId, searchQuery, setSearchQuery } = useGlobalPropertySelection();

  const isPortfolio = pathname === '/command-center' || pathname === '/';
  const isAI = pathname === '/ai' || pathname.startsWith('/ai') || pathname === '/ai-assistant';
  const showScopeSelector = !isAI;
  const showTopbarSearch = !isPortfolio && !isAI;

  return (
    <LinearGradientWithDataSet
      dataSet={{ responsiveLayout: 'desktop' }}
      colors={theme.Colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, flexDirection: 'row' }}
    >
      {/* 1. Persistent Pinned Left Sidebar */}
      <SidebarNavigation />

      {/* 2. Main Desktop Column with Persistent Pinned Topbar */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <DesktopNavBar 
          properties={showScopeSelector ? (properties || []).map((p: any) => ({ id: p.id, name: p.name })) : []}
          selectedPropertyId={selectedPropertyId}
          onPropertyChange={setSelectedPropertyId}
          searchQuery={showTopbarSearch ? searchQuery : undefined}
          onSearchChange={showTopbarSearch ? setSearchQuery : undefined}
          showSearch={showTopbarSearch}
          searchPlaceholder="Search or jump to..."
        />

        {/* 3. Dynamic Inner Screen View */}
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </View>
    </LinearGradientWithDataSet>
  );
}

function MobileLayoutShell({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();
  return (
    <LinearGradient
      colors={(theme.Colors.backgroundGradient || ['#090D12', '#0F1720', '#141E2A']) as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, minHeight: '100%', flexDirection: 'column', backgroundColor: theme.Colors.background }}
    >
      {children}
    </LinearGradient>
  );
}

function NavigationThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme, isDark } = useAppTheme();
  const navTheme = React.useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: theme.Colors.background,
      },
    };
  }, [isDark, theme]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const bgColor = theme.Colors.background;
      document.documentElement.style.backgroundColor = bgColor;
      document.body.style.backgroundColor = bgColor;

      let scrollbarStyle = document.getElementById('livic-scrollbar-styles');
      if (!scrollbarStyle) {
        scrollbarStyle = document.createElement('style');
        scrollbarStyle.id = 'livic-scrollbar-styles';
        document.head.appendChild(scrollbarStyle);
      }
      scrollbarStyle.textContent = `
        ::-webkit-scrollbar {
          width: ${Spacing.unit}px;
          height: ${Spacing.unit}px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: ${theme.Colors.scrollbarThumb};
          border-radius: ${Rounded.full}px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${theme.Colors.scrollbarThumbHover};
        }
      `;
    }
  }, [theme.Colors.background, theme.Colors.scrollbarThumb, theme.Colors.scrollbarThumbHover]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.Colors.background }}>
      <ThemeProvider value={navTheme}>
        {children}
      </ThemeProvider>
    </View>
  );
}

export default function RootLayout() {
  const { isDesktop } = useResponsive();
  const pathname = usePathname();

  const [moreSheetVisible, setMoreSheetVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (Platform.OS === 'web') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Manrope:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&family=Hanken+Grotesk:wght@400;600;700;800&display=swap';
      document.head.appendChild(link);

      const style = document.createElement('style');
      style.textContent = `
        input, textarea, select {
          outline: none !important;
          box-shadow: none !important;
        }
        input:focus, textarea:focus, select:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        *:focus {
          outline: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const AUTH_OR_STANDALONE_ROUTES = ['/login', '/signup', '/verify-email', '/onboarding', '/mode-selection', '/'];
  const hideNavigation = pathname === '/login' || pathname === '/signup' || pathname === '/verify-email' || pathname === '/onboarding' || pathname === '/mode-selection';
  const cleanPathname = pathname.split('?')[0];
  const isPrimaryRoute = PRIMARY_ROUTES.includes(cleanPathname);
  const showDesktop = isDesktop;
  const hideHeader = hideNavigation || AUTH_OR_STANDALONE_ROUTES.includes(cleanPathname);

  return (
    <SafeAreaProvider>
      <ThemeContextProvider>
        <NavigationThemeWrapper>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <ToastProvider>
                <AuthProvider>
                  <AdminTutorialProvider>
                    <PropertySelectionProvider>
                      <ScrollProvider>
                    {showDesktop && !hideNavigation ? (
                      <DesktopLayoutShell>
                        <ScreenWrapper isAuth={hideNavigation}>
                          <OnboardingGate>
                            <Stack screenOptions={{ 
                              headerShown: false, 
                              contentStyle: { backgroundColor: 'transparent' },
                              animation: 'fade',
                              animationDuration: Timing.normal,
                            }}>
                              <Stack.Screen name="index" />
                              <Stack.Screen name="login" />
                              <Stack.Screen name="signup" />
                              <Stack.Screen name="verify-email" />
                              <Stack.Screen name="mode-selection" />
                              <Stack.Screen name="onboarding" />
                              <Stack.Screen name="command-center" />
                              <Stack.Screen name="ai" />
                              <Stack.Screen name="admin" />
                              <Stack.Screen name="analytics" />
                              <Stack.Screen name="reports" />
                              <Stack.Screen name="billing" />
                              <Stack.Screen name="expenses/index" />
                              <Stack.Screen name="expenses/charge-config" />
                              <Stack.Screen name="expenses/billing-worksheet" />
                              <Stack.Screen name="expenses/ledger" />
                              <Stack.Screen name="expenses/rent-roll" />
                              <Stack.Screen name="leases" />
                              <Stack.Screen name="inventory" />
                              <Stack.Screen name="create-expense" />
                              <Stack.Screen name="properties/create" />
                              <Stack.Screen name="properties/[id]/index" />
                              <Stack.Screen name="properties/[id]/meter-readings" />
                              <Stack.Screen name="properties/[id]/memberships" />
                              <Stack.Screen name="escalations" />
                              <Stack.Screen name="announcements" />
                              <Stack.Screen name="settings" />
                            </Stack>
                          </OnboardingGate>
                        </ScreenWrapper>
                      </DesktopLayoutShell>
                    ) : (
                      <MobileLayoutShell>
                        {!hideHeader && (
                          <MobileHeader 
                            title={getMobileHeaderTitle(pathname)} 
                            onNotificationPress={() => router.push('/escalations')}
                          />
                        )}
                        <ScreenWrapper isAuth={hideNavigation}>
                          <OnboardingGate>
                            <Stack screenOptions={{ 
                              headerShown: false, 
                              contentStyle: { backgroundColor: 'transparent' },
                              animation: 'fade',
                              animationDuration: Timing.normal,
                            }}>
                              <Stack.Screen name="index" />
                              <Stack.Screen name="login" />
                              <Stack.Screen name="signup" />
                              <Stack.Screen name="verify-email" />
                              <Stack.Screen name="mode-selection" />
                              <Stack.Screen name="onboarding" />
                              <Stack.Screen name="command-center" />
                              <Stack.Screen name="ai" />
                              <Stack.Screen name="admin" />
                              <Stack.Screen name="analytics" />
                              <Stack.Screen name="reports" />
                              <Stack.Screen name="billing" />
                              <Stack.Screen name="expenses/index" />
                              <Stack.Screen name="expenses/charge-config" />
                              <Stack.Screen name="expenses/billing-worksheet" />
                              <Stack.Screen name="expenses/ledger" />
                              <Stack.Screen name="expenses/rent-roll" />
                              <Stack.Screen name="leases" />
                              <Stack.Screen name="inventory" />
                              <Stack.Screen name="create-expense" />
                              <Stack.Screen name="properties/create" />
                              <Stack.Screen name="properties/[id]/index" />
                              <Stack.Screen name="properties/[id]/meter-readings" />
                              <Stack.Screen name="properties/[id]/memberships" />
                              <Stack.Screen name="escalations" />
                              <Stack.Screen name="announcements" />
                              <Stack.Screen name="settings" />
                            </Stack>
                          </OnboardingGate>
                        </ScreenWrapper>
                      </MobileLayoutShell>
                    )}
                    
                    {!showDesktop && !hideNavigation && !(pathname === '/ai' || pathname.startsWith('/ai') || pathname === '/ai-assistant') && (
                      <>
                        <BottomNavigation 
                          onMorePress={() => setMoreSheetVisible(true)} 
                          onQRPress={() => setQrModalVisible(true)} 
                        />
                        <FloatingAIAssistant />
                        <MobileMoreSheet 
                          visible={moreSheetVisible} 
                          onClose={() => setMoreSheetVisible(false)} 
                        />
                        <QRScannerModal 
                          visible={qrModalVisible} 
                          onClose={() => setQrModalVisible(false)} 
                        />
                      </>
                    )}
                    </ScrollProvider>
                  </PropertySelectionProvider>
                </AdminTutorialProvider>
              </AuthProvider>
          </ToastProvider>
          <StatusBar style="auto" translucent backgroundColor="transparent" />
        </QueryClientProvider>
      </ErrorBoundary>
    </NavigationThemeWrapper>
  </ThemeContextProvider>
</SafeAreaProvider>
  );
}
