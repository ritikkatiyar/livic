import { useRouter } from 'expo-router';

import SuperAdminSignupScreen from '@/src/features/auth/screens/SuperAdminSignupScreen';
import type { SignupResponse } from '@/src/types/auth';

export default function SignupRoute() {
  const router = useRouter();

  return (
    <SuperAdminSignupScreen
      onSignup={(response: SignupResponse) => {
        router.replace({ pathname: '/verify-email', params: { email: response.email, sent: '1' } });
      }}
      onNavigateToLogin={() => router.replace('/login')}
    />
  );
}
