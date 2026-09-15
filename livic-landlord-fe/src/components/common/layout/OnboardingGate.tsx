import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { getUserPreference } from '@/src/features/user/api/userPreference.api';
import { getMyContext } from '@/src/features/auth/api/me.api';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { canAccessRoute, routeRequirement } from '@/src/features/auth/permissions';
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

  // The permission guard overlays the screen instead of replacing it: unmounting the navigator changes the
  // pathname, which flips the guard off and remounts it, looping until React aborts ("Maximum update depth").
  const isGatedRoute = isAuthenticated && !isAuthRoute && !isOnboardingRoute && routeRequirement(pathname) !== null;
  const guardState = !isGatedRoute ? null : !context ? 'loading' : canAccessRoute(context, pathname) ? null : 'denied';

  return (
    <View style={{ flex: 1 }}>
      {children}
      {guardState && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { justifyContent: 'center', alignItems: 'center', padding: theme.Spacing.lg, gap: theme.Spacing.sm, backgroundColor: theme.Colors.background },
          ]}
        >
          {guardState === 'loading' ? (
            <ActivityIndicator size="large" color={theme.Colors.primary} />
          ) : (
            <>
              <MaterialIcons name="lock-outline" size={40} color={theme.Colors.onSurfaceVariant} />
              <Text style={{ fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '600', color: theme.Colors.onSurface }}>
                No access
              </Text>
              <Text style={{ fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, textAlign: 'center' }}>
                You don&apos;t have permission to view this section. Ask the property owner to update your access.
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}
