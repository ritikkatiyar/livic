import { Redirect } from 'expo-router';

import SettingsMenuScreen from '@/src/features/finance/screens/SettingsMenuScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function ExpensesIndexRoute() {
  const { isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <SettingsMenuScreen />;
}
