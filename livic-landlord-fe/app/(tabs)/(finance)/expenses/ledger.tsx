import { Redirect } from 'expo-router';
import LedgerScreen from '@/src/features/finance/screens/LedgerScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function LedgerRoute() {
  const { accessToken, isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <LedgerScreen token={accessToken} />;
}
