import { useRouter } from 'expo-router';

import SuperAdminLoginScreen from '@/src/features/auth/screens/SuperAdminLoginScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { getMyContext } from '@/src/features/auth/api/me.api';
import { getPreference } from '@/src/features/auth/api/user-preference.api';
import type { TokenBundle } from '@/src/types/auth';

export default function LoginRoute() {
  const router = useRouter();
  const { signIn, setContext } = useAuth();

  return (
    <SuperAdminLoginScreen
      onLogin={async (authData: TokenBundle) => {
        await signIn(authData);
        
        const [preference, context] = await Promise.all([
          getPreference(authData.accessToken),
          getMyContext(authData.accessToken),
        ]);
        
        setContext(context);
        router.replace('/tenant-home');
      }}
      onUnverified={(email: string) => {
        router.push({ pathname: '/verify-email', params: { email } });
      }}
      onNavigateToSignup={() => router.push('/signup')}
    />
  );
}
