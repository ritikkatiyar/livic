import { Redirect } from 'expo-router';

import { useAuth } from '@/src/features/auth/context/AuthProvider';
import MessMenuScreen from '@/src/features/mess/screens/MessMenuScreen';

export default function MessMenuRoute() {
  const { isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <MessMenuScreen />;
}
