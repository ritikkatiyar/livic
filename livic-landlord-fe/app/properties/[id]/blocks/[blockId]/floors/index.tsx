import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import FloorListOverviewScreen from '@/src/features/properties/screens/FloorListOverviewScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

/** The floors of one building. The blockless route below falls back to the default block. */
export default function BlockFloorListRoute() {
  const { id, blockId, blockName, blockTotalFloors } = useLocalSearchParams<{
    id: string;
    blockId: string;
    blockName?: string;
    blockTotalFloors?: string;
  }>();
  const router = useRouter();
  const { accessToken, isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!id || !blockId) {
    return <Redirect href="/command-center" />;
  }

  const parsedTotalFloors = blockTotalFloors && blockTotalFloors.trim() !== ''
    ? parseInt(blockTotalFloors, 10)
    : undefined;

  return (
    <FloorListOverviewScreen
      propertyId={id}
      blockId={blockId}
      blockName={blockName}
      blockTotalFloors={isNaN(parsedTotalFloors as any) ? undefined : parsedTotalFloors}
      userToken={accessToken || ''}
      onBack={() => router.back()}
      onEditFloor={(floorNumber) =>
        router.push(`/properties/${id}/blocks/${blockId}/floors/${floorNumber}`)
      }
    />
  );
}
