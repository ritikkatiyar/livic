import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import FloorEditorScreen from '@/src/features/properties/screens/FloorEditorScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function BlockFloorEditorRoute() {
  const { id, blockId, floorNumber } = useLocalSearchParams<{
    id: string;
    blockId: string;
    floorNumber: string;
  }>();
  const router = useRouter();
  const { accessToken, isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!id || !blockId || !floorNumber) {
    return <Redirect href="/command-center" />;
  }

  return (
    <FloorEditorScreen
      propertyId={id}
      buildingBlockId={blockId}
      floorNumber={parseInt(floorNumber, 10)}
      userToken={accessToken || ''}
      onBack={() => router.back()}
      onSave={() => router.back()}
    />
  );
}
