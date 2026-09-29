import { Redirect } from 'expo-router';

import BillingWorksheetScreen from '@/src/features/finance/screens/BillingWorksheetScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function BillingWorksheetRoute() {
  const { accessToken, isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <BillingWorksheetScreen token={accessToken} />;
}
