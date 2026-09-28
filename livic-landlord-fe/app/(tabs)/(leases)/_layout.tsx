import { Stack } from 'expo-router';
import { STACK_SCREEN_OPTIONS } from '@/src/components/common/navigation/navigatorOptions';

// Leases tab: leases plus move-in/out inventory, which opens from a lease.
export const unstable_settings = { initialRouteName: 'leases' };

export default function LeasesTabLayout() {
  return <Stack screenOptions={STACK_SCREEN_OPTIONS} />;
}
