import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import EditPropertyScreen from '@/src/features/properties/screens/EditPropertyScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function EditPropertyRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!id) {
    return <Redirect href="/command-center" />;
  }

  return (
    <EditPropertyScreen
      propertyId={id}
      userToken={accessToken || ''}
      onBack={() => router.back()}
      onSave={() => router.replace('/command-center')}
      onConfigureFloors={() => router.push(`/properties/${id}/floors`)}
    />
  );
}
