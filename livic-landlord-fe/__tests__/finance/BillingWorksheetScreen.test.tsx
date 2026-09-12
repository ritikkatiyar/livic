import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BillingWorksheetScreen from '../../src/features/finance/screens/BillingWorksheetScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    propertyId: 'prop-123',
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children, style }: any) => <View style={style}>{children}</View>,
  };
});

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

jest.mock('@/src/hooks/useProperties', () => ({
  useProperties: () => ({
    properties: [{ id: 'prop-123', name: 'Greenwood Residency' }],
  }),
}));

jest.mock('@/src/features/finance/api/charge.api', () => ({
  getActiveChargesForProperty: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/src/features/finance/api/worksheet.api', () => ({
  getOrCreateWorksheet: jest.fn(() => Promise.resolve([])),
}));

describe('BillingWorksheetScreen Component', () => {
  it('renders correctly', async () => {
    const { getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <BillingWorksheetScreen token="token" />
      </QueryClientProvider>
    );
    expect(getByText(/Worksheets/i)).toBeTruthy();
  }, 30000);
});
