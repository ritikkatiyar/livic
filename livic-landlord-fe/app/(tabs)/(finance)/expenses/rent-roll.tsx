import { Redirect } from 'expo-router';
import RentRollScreen from '@/src/features/finance/screens/RentRollScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function RentRollRoute() {
  const { accessToken, isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <RentRollScreen token={accessToken} />;
}
