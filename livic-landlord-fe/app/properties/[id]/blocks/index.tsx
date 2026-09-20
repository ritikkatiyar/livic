import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import BlockListScreen from '@/src/features/properties/screens/BlockListScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function BlockListRoute() {
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
    <BlockListScreen
      propertyId={id}
      userToken={accessToken || ''}
      onBack={() => router.back()}
      onOpenBlock={(block) =>
        router.push(
          `/properties/${id}/blocks/${block.id}/floors?blockName=${encodeURIComponent(block.name)}&blockTotalFloors=${block.totalFloors ?? ''}`
        )
      }
    />
  );
}
