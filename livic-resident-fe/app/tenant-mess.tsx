import { Redirect } from 'expo-router';
import TenantMessScreen from '@/src/features/mess/screens/TenantMessScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function TenantMessRoute() {
  const { isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <TenantMessScreen />;
}
