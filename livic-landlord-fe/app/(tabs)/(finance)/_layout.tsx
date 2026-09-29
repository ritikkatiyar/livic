import { Stack } from 'expo-router';
import { STACK_SCREEN_OPTIONS } from '@/src/components/common/navigation/navigatorOptions';

// Finance tab: rent roll, ledger, worksheets, charges, expenses and the subscription page.
export const unstable_settings = { initialRouteName: 'expenses/index' };

export default function FinanceTabLayout() {
  return <Stack screenOptions={STACK_SCREEN_OPTIONS} />;
}
