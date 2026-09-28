import { Stack } from 'expo-router';
import { STACK_SCREEN_OPTIONS } from '@/src/components/common/navigation/navigatorOptions';

// Home tab: My Properties plus everything opened from a property (floors, editor, settings).
export const unstable_settings = { initialRouteName: 'command-center' };

export default function HomeTabLayout() {
  return <Stack screenOptions={STACK_SCREEN_OPTIONS} />;
}
