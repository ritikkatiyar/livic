import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import FloorEditorScreen from '@/src/features/properties/screens/FloorEditorScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function FloorEditorRoute() {
  const { id, floorNumber } = useLocalSearchParams<{ id: string, floorNumber: string }>();
  const router = useRouter();
  const { accessToken, isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!id || !floorNumber) {
    return <Redirect href="/command-center" />;
  }

  return (
    <FloorEditorScreen
      propertyId={id}
      floorNumber={parseInt(floorNumber, 10)}
      userToken={accessToken || ''}
      onBack={() => router.back()}
      onSave={() => router.back()}
    />
  );
}
