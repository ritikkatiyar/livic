import { Stack } from 'expo-router';
import { STACK_SCREEN_OPTIONS } from '@/src/components/common/navigation/navigatorOptions';

// Alerts tab: maintenance issues.
export const unstable_settings = { initialRouteName: 'escalations' };

export default function AlertsTabLayout() {
  return <Stack screenOptions={STACK_SCREEN_OPTIONS} />;
}
