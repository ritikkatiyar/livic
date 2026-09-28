import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RentRollScreen from '../../src/features/finance/screens/RentRollScreen';

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

jest.mock('@/src/components/common/feedback/ToastContext', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

jest.mock('@/src/features/auth/context/AuthProvider', () => {
  const auth = { accessToken: 'mock-access-token', user: { id: 'user-123' } };
  return { useAuth: () => auth, useAuthOptional: () => auth };
});

jest.mock('@/src/features/finance/hooks/useRentRoll', () => ({
  useRentRoll: () => ({
    rentCyclesData: {
      content: [
        {
          id: 'cycle-1',
          unitNumber: 'Unit 101',
          tenantName: 'John Doe',
          baseRent: 15000,
          totalAmount: 15000,
          status: 'UNPAID',
          published: true,
          billingMonth: '2023-10',
          dueDate: '2023-10-05',
        }
      ],
      totalElements: 1,
      totalPages: 1,
    },
    checklist: {
      occupiedLeasesCount: 5,
      configuredLeasesCount: 5,
      isChecklistValid: true,
    },
    isLoading: false,
    refetchList: jest.fn(),
    generateRentCycle: jest.fn(),
    isGenerating: false,
    publishRentCycles: jest.fn(),
    isPublishing: false,
    publishSingleInvoice: jest.fn(),
    unpublishRentCycles: jest.fn(),
    isUnpublishing: false,
    recordCashPayment: jest.fn(),
    isRecordingCash: false,
  }),
}));

jest.setTimeout(30000);

describe('RentRollScreen Component', () => {
  it('renders rent cycles correctly', async () => {
    const { getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <RentRollScreen token="token" />
      </QueryClientProvider>
    );

    expect(getByText(/John Doe/)).toBeTruthy();
    expect(getByText(/Unit 101/)).toBeTruthy();
  });
});
