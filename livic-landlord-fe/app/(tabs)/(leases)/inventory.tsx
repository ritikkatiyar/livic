import { Redirect } from 'expo-router';
import InventoryScreen from '@/src/features/inventory/screens/InventoryScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function InventoryRoute() {
  const { isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <InventoryScreen />;
}
