import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TenantPaymentsScreen from '../../src/features/tenant/screens/TenantPaymentsScreen';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
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

jest.mock('@/src/features/tenant/api/payments.api', () => ({
  getTenantRentCycles: jest.fn(() => Promise.resolve([
    {
      id: 'cycle-1',
      billingMonth: '2023-10',
      totalAmount: 12000,
      status: 'UNPAID',
    }
  ])),
  markRentCyclePaid: jest.fn(() => Promise.resolve({})),
  fetchStatementHtml: jest.fn(() => Promise.resolve('<html></html>')),
}));

jest.mock('@/src/features/tenant/api/lease.api', () => ({
  getActiveLease: jest.fn(() => Promise.resolve(null)),
}));

jest.setTimeout(30000);

describe('TenantPaymentsScreen Component', () => {
  it('renders payment cycles and manages Autopay state correctly', async () => {
    const { getByText } = await render(
      <TenantPaymentsScreen token="token" onLogout={jest.fn()} />
    );

    await waitFor(() => {
      expect(getByText('2023-10')).toBeTruthy();
      expect(getByText('Enable Autopay')).toBeTruthy();
    });
  });
});
