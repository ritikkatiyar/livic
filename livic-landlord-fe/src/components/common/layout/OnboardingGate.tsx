import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { getUserPreference } from '@/src/features/user/api/userPreference.api';
import { getMyContext } from '@/src/features/auth/api/me.api';
import { View, ActivityIndicator } from 'react-native';
import { logger } from '@/src/utils/logger';

function getLocalOnboardingStatus(token: string | null): boolean | null {
  if (!token) return null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(`livic_onboarded_${token.slice(-10)}`);
      if (val === 'true') return true;
      if (val === 'false') return false;
    }
  } catch {}
  return null;
}

export function setLocalOnboardingStatus(token: string | null, status: boolean) {
  if (!token) return;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`livic_onboarded_${token.slice(-10)}`, status ? 'true' : 'false');
    }
  } catch {}
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();
  const { isAuthenticated, isReady, accessToken, context, setContext } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Check cached status so already-onboarded users load immediately on refresh
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(() => getLocalOnboardingStatus(accessToken));

  const isAuthRoute = pathname === '/login' || pathname === '/signup' || pathname === '/verify-email';
  const isOnboardingRoute = pathname === '/onboarding';

  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated) {
      setIsOnboarded(null);
      return;
    }

    if (isOnboardingRoute) {
      return;
    }

    if (isReady && !isAuthRoute && !isOnboardingRoute && accessToken) {
      const runInit = async () => {
        try {
          let currentContext = context;
          if (!currentContext) {
            currentContext = await getMyContext(accessToken);
            if (isMounted) {
              setContext(currentContext);
            }
          }

          const pref = await getUserPreference(accessToken);
          const done = Boolean(pref?.onboardingDone);
          setLocalOnboardingStatus(accessToken, done);
          if (isMounted) {
            setIsOnboarded(done);
          }
        } catch (error) {
          logger.error('[OnboardingGate] Error during init:', error);
          // On network failure or error, fallback to true only if no cached value
          if (isMounted && isOnboarded === null) {
            setIsOnboarded(true);
          }
        }
      };

      runInit();
    }

    return () => {
      isMounted = false;
    };
  }, [isReady, isAuthenticated, accessToken, isOnboardingRoute, isAuthRoute]);

  // Programmatic redirection for non-authenticated or un-onboarded users
  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated && !isAuthRoute && pathname !== '/') {
      router.replace('/login');
    } else if (isAuthenticated && !isAuthRoute && !isOnboardingRoute && isOnboarded === false) {
      router.replace('/onboarding');
    }
  }, [isReady, isAuthenticated, isAuthRoute, isOnboardingRoute, isOnboarded, pathname]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.Colors.background }}>
        <ActivityIndicator size="large" color={theme.Colors.primary} />
      </View>
    );
  }

  const isPendingRedirect = 
    (!isAuthenticated && !isAuthRoute && pathname !== '/') ||
    (isAuthenticated && !isAuthRoute && !isOnboardingRoute && (isOnboarded === false || isOnboarded === null));

  if (isPendingRedirect) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.Colors.background }}>
        <ActivityIndicator size="large" color={theme.Colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}
