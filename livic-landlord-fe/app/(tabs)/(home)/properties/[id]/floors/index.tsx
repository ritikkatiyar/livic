import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import FloorListOverviewScreen from '@/src/features/properties/screens/FloorListOverviewScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { getBlocks, shouldShowBlocks } from '@/src/features/properties/api/block.api';

/**
 * The property's structural entry point.
 *
 * One building means there is nothing to choose between, so this goes straight to its
 * floors and the landlord never meets the concept of a block. A second building makes the
 * building list appear instead. Existing links into this route keep working either way.
 */
export default function FloorListOverviewRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, isAuthenticated, isReady } = useAuth();

  const [checking, setChecking] = useState(true);
  const [showBlocks, setShowBlocks] = useState(false);

  useEffect(() => {
    let active = true;
    if (!id || !accessToken) {
      return;
    }
    getBlocks(id, accessToken)
      .then((blocks) => {
        if (active) {
          setShowBlocks(shouldShowBlocks(blocks));
        }
      })
      // A property with no blocks yet, or a failed call, behaves as it always has.
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setChecking(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id, accessToken]);

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!id) {
    return <Redirect href="/command-center" />;
  }

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (showBlocks) {
    return <Redirect href={`/properties/${id}/blocks`} />;
  }

  return (
    <FloorListOverviewScreen
      propertyId={id}
      userToken={accessToken || ''}
      onBack={() => router.back()}
      onEditFloor={(floorNumber) => router.push(`/properties/${id}/floors/${floorNumber}`)}
    />
  );
}
