import { Redirect } from 'expo-router';

import ExpenseConfigurationScreen from '@/src/features/finance/screens/ExpenseConfigurationScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function ChargeConfigRoute() {
  const { accessToken, isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <ExpenseConfigurationScreen token={accessToken} />;
}
