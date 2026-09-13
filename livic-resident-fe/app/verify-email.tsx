import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import VerifyEmailScreen from '@/src/features/auth/screens/VerifyEmailScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import type { TokenBundle } from '@/src/types/auth';

export default function VerifyEmailRoute() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { email, sent } = useLocalSearchParams<{ email?: string; sent?: string }>();

  if (!email) {
    return <Redirect href="/signup" />;
  }

  return (
    <VerifyEmailScreen
      email={email}
      codeAlreadySent={sent === '1'}
      onVerified={async (authData: TokenBundle) => {
        await signIn(authData);
        router.replace('/tenant-home');
      }}
      onChangeEmail={() => router.replace('/signup')}
    />
  );
}
