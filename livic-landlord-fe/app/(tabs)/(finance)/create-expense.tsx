import { Redirect } from 'expo-router';

import CreateExpenseScreen from '@/src/features/finance/screens/CreateExpenseScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function CreateExpenseRoute() {
  const { accessToken, isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <CreateExpenseScreen token={accessToken} />;
}
