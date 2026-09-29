import { Redirect } from 'expo-router';

import MeterReadingScreen from '@/src/features/finance/screens/MeterReadingScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function MeterReadingsRoute() {
  const { accessToken, isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <MeterReadingScreen token={accessToken} />;
}
