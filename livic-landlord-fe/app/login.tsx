import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import SuperAdminLoginScreen from '@/src/features/auth/screens/SuperAdminLoginScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { getMyContext } from '@/src/features/auth/api/me.api';
import { getPreference } from '@/src/features/auth/api/user-preference.api';
import type { TokenBundle } from '@/src/types/auth';

export default function LoginRoute() {
  const router = useRouter();
  const { signIn, setContext, signOut } = useAuth();

  return (
    <SuperAdminLoginScreen
      onLogin={async (authData: TokenBundle) => {
        await signIn(authData);
        
        const [preference, context] = await Promise.all([
          getPreference(authData.accessToken),
          getMyContext(authData.accessToken),
        ]);
        
        setContext(context);
        
        if (context.isTenant && !context.isLandlord) {
          // Pure tenants are not allowed to log in to the landlord app
          await signOut();
          Alert.alert(
            'Access Denied',
            'This application is for Landlords and Property Managers only. Tenants should use the Resident app.'
          );
        } else if (!preference.onboardingDone) {
          router.replace('/mode-selection');
        } else {
          // Landlord / Manager goes directly to command center
          router.replace('/command-center');
        }
      }}
      onUnverified={(email: string) => {
        router.push({ pathname: '/verify-email', params: { email } });
      }}
      onNavigateToSignup={() => router.push('/signup')}
    />
  );
}
