import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LedgerScreen from '../../src/features/finance/screens/LedgerScreen';

const queryClient = new QueryClient();

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

const mockLedgerItems = [
  {
    id: 'txn-1',
    date: '2023-10-01T10:00:00.000Z',
    description: 'Rent Payment - Unit 101',
    amount: 15000,
    transactionType: 'CREDIT',
    referenceId: 'ref-1',
  }
];

jest.mock('@/src/features/finance/hooks/useLedger', () => ({
  useLedger: () => ({
    ledger: mockLedgerItems,
    totalPages: 1,
    isLoading: false,
    refetch: jest.fn(),
  }),
}));

jest.setTimeout(30000);

describe('LedgerScreen Component', () => {
  it('renders ledger transactions correctly', async () => {
    const { getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <LedgerScreen token="token" />
      </QueryClientProvider>
    );

    expect(getByText('Rent Payment - Unit 101')).toBeTruthy();
  });
});
