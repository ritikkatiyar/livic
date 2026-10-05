import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import TenantMaintenanceScreen from '../../src/features/tenant/screens/TenantMaintenanceScreen';

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

jest.mock('@/src/features/auth/context/AuthProvider', () => ({
  useAuth: () => ({
    context: { unitMemberships: [{ role: 'TENANT', propertyId: 'property-1', unitId: 'unit-1' }] },
  }),
}));

jest.mock('@/src/features/tenant/api/maintenance.api', () => ({
  getMaintenanceTickets: jest.fn(() => Promise.resolve([
    {
      id: 'ticket-1',
      title: 'Leaking Pipe',
      description: 'The kitchen sink is leaking.',
      category: 'PLUMBING',
      priority: 'STANDARD',
      status: 'PENDING',
    }
  ])),
  getTicketHealthStats: jest.fn(() => Promise.resolve({
    pendingCount: 1,
    resolvedCount: 2,
  })),
  createMaintenanceTicket: jest.fn(() => Promise.resolve({})),
}));

jest.setTimeout(30000);

describe('TenantMaintenanceScreen Component', () => {
  it('renders health stats and ticket history correctly', async () => {
    const { getByText } = await render(
      <TenantMaintenanceScreen token="token" onLogout={jest.fn()} />
    );

    await waitFor(() => {
      expect(getByText('Leaking Pipe')).toBeTruthy();
      expect(getByText('Active Open Tickets')).toBeTruthy();
    });
  });
});
