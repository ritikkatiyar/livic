import { Redirect, useRouter } from 'expo-router';

import CreatePropertyScreen from '@/src/features/properties/screens/CreatePropertyScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function CreatePropertyRoute() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isReady, user } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <CreatePropertyScreen
      userToken={accessToken}
      ownerId={user?.id || ''}
      onBack={() => router.back()}
      onSaveAndConfigure={(propertyId: string) => router.replace(`/properties/${propertyId}/floors`)}
      onSaveAndAddBlocks={(propertyId: string) => router.replace(`/properties/${propertyId}/blocks`)}
    />
  );
}
