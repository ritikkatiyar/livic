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
import SidebarNavigation from '@/src/components/common/navigation/SidebarNavigation';
import MobileHeader from '@/src/components/common/navigation/MobileHeader';
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
import { STACK_SCREEN_OPTIONS } from '@/src/components/common/navigation/navigatorOptions';

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

function AppBackground({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();
  return (
    <LinearGradient
      colors={(theme.Colors.backgroundGradient || [theme.Colors.onSurface, theme.Colors.onSurface, theme.Colors.onSurface]) as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, minHeight: '100%', flexDirection: 'column', backgroundColor: theme.Colors.background }}
    >
      {children}
    </LinearGradient>
  );
}

/**
 * Root navigator: auth and onboarding screens, plus the signed-in app under (tabs),
 * which owns the bottom bar and each tab's own history.
 */
function RootStack() {
  return (
    <Stack screenOptions={STACK_SCREEN_OPTIONS}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="mode-selection" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

/**
 * Status bar icons follow the app's chosen theme. `style="auto"` follows the phone's theme
 * instead, which hides the icons whenever the two differ (e.g. app light, phone dark).
 */
function ThemedStatusBar() {
  const { isDark } = useAppTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />;
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
                        {/* Chrome (header, bottom bar, assistant, or the desktop sidebar) is
                            owned by the app shell in app/(tabs)/_layout.tsx, so screens outside
                            it — login, onboarding, the AI desk — are full-screen automatically. */}
                        <AppBackground>
                          <ScreenWrapper>
                            <OnboardingGate>
                              <RootStack />
                            </OnboardingGate>
                          </ScreenWrapper>
                        </AppBackground>
                      </ScrollProvider>
                  </PropertySelectionProvider>
                </AdminTutorialProvider>
              </AuthProvider>
          </ToastProvider>
          <ThemedStatusBar />
        </QueryClientProvider>
      </ErrorBoundary>
    </NavigationThemeWrapper>
  </ThemeContextProvider>
</SafeAreaProvider>
  );
}
