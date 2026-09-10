import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { getMyContext } from '@/src/features/auth/api/me.api';
import { View, ActivityIndicator } from 'react-native';
import { logger } from '@/src/utils/logger';

export function setLocalOnboardingStatus(_token: string | null, _status: boolean) {
  // No-op for resident frontend: residents bypass onboarding gate
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();
  const { isAuthenticated, isReady, accessToken, context, setContext } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated) {
      return;
    }

    if (isReady && !isAuthRoute && accessToken) {
      const runInit = async () => {
        try {
          let currentContext = context;
          if (!currentContext) {
            currentContext = await getMyContext(accessToken);
            if (isMounted) {
              setContext(currentContext);
            }
          }
        } catch (error) {
          logger.error('[OnboardingGate] Error during init:', error);
        }
      };

      runInit();
    }

    return () => {
      isMounted = false;
    };
  }, [isReady, isAuthenticated, pathname, accessToken, isAuthRoute, context, setContext]);

  // Programmatic redirection for non-authenticated users
  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated && !isAuthRoute && pathname !== '/') {
      router.replace('/login');
    }
  }, [isReady, isAuthenticated, isAuthRoute, pathname, router]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.Colors.background }}>
        <ActivityIndicator size="large" color={theme.Colors.primary} />
      </View>
    );
  }

  const isPendingRedirect = !isAuthenticated && !isAuthRoute && pathname !== '/';

  if (isPendingRedirect) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.Colors.background }}>
        <ActivityIndicator size="large" color={theme.Colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}
