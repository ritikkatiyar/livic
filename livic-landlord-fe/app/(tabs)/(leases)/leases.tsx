import { Redirect } from 'expo-router';
import OwnerLeasesScreen from '@/src/features/leases/screens/OwnerLeasesScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function LeasesRoute() {
  const { isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <OwnerLeasesScreen />;
}
