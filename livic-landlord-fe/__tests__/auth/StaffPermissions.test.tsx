import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SidebarNavigation from '../../src/components/common/navigation/SidebarNavigation';
import { PermissionPicker } from '../../src/features/settings/components/PermissionPicker';
import { canAccessRoute, hasPermission } from '../../src/features/auth/permissions';
import type { MyContextResponse } from '../../src/features/auth/api/me.api';

const ALL_MODULE_LABELS = ['Analytics', 'Portfolio', 'Reports', 'AI Desk', 'Leases', 'Inventory', 'Escalations', 'Announcements', 'Finance & Billing', 'Settings'];

// Codes a caretaker receives from a custom-access join code in the end-to-end flow.
const CARETAKER_CODES = ['METER_READING_VIEW', 'METER_READING_CREATE', 'ISSUE_VIEW'];

function contextWith(membership: Partial<MyContextResponse['managedProperties'][number]>): MyContextResponse {
  return {
    globalRole: 'USER',
    managedProperties: [{ propertyId: 'prop-1', propertyName: 'Green Mansion', title: 'Caretaker', ...membership }],
    tenantProperties: [],
    activeLeases: [],
    isLandlord: true,
    isTenant: false,
  };
}

let mockContext: MyContextResponse | null = null;

jest.mock('@/src/features/auth/context/AuthProvider', () => ({
  useAuth: () => ({ context: mockContext, accessToken: 'token', signOut: jest.fn() }),
}));

jest.mock('@/src/features/properties/api/permissionCatalog.api', () => ({
  getPermissionCatalog: jest.fn().mockResolvedValue([
    {
      module: 'FINANCE',
      features: [
        { code: 'METER_READING_VIEW', label: 'View Meter Readings', description: '' },
        { code: 'METER_READING_CREATE', label: 'Add Meter Readings', description: '' },
      ],
    },
    {
      module: 'ISSUES',
      features: [
        { code: 'ISSUE_VIEW', label: 'View Issues', description: '' },
        { code: 'ISSUE_MANAGE', label: 'Manage Issues', description: '' },
      ],
    },
  ]),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/command-center',
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: (fn: () => object) => fn(),
    withTiming: (v: number) => v,
    withSpring: (v: number) => v,
    Easing: { bezier: () => () => 0 },
  };
});

describe('staff permission rules', () => {
  const caretaker = contextWith({ accessType: 'CUSTOM_ACCESS', permissionCodes: CARETAKER_CODES });

  it('opens only the screens a custom-access caretaker was granted', () => {
    expect(canAccessRoute(caretaker, '/expenses')).toBe(true);
    expect(canAccessRoute(caretaker, '/properties/prop-1/meter-readings')).toBe(true);
    expect(canAccessRoute(caretaker, '/escalations')).toBe(true);
    expect(canAccessRoute(caretaker, '/expenses/ledger?propertyId=prop-1')).toBe(false);
    expect(canAccessRoute(caretaker, '/expenses/charge-config')).toBe(false);
    expect(canAccessRoute(caretaker, '/inventory')).toBe(false);
    expect(canAccessRoute(caretaker, '/billing')).toBe(false);
    expect(canAccessRoute(caretaker, '/settings')).toBe(true);
  });

  it('scopes checks to a property when one is given', () => {
    expect(hasPermission(caretaker, ['METER_READING_CREATE'], 'prop-1')).toBe(true);
    expect(hasPermission(caretaker, ['METER_READING_CREATE'], 'other-prop')).toBe(false);
  });

  it('keeps every screen for a landlord who has not created a property yet', () => {
    expect(canAccessRoute({ ...caretaker, managedProperties: [] }, '/expenses/ledger')).toBe(true);
  });

  it('hides gated screens until the context has loaded', () => {
    expect(canAccessRoute(null, '/leases')).toBe(false);
    expect(canAccessRoute(null, '/command-center')).toBe(true);
  });
});

describe('PermissionPicker', () => {
  const renderPicker = async (selected: string[], onChange: jest.Mock) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={client}>
        <PermissionPicker selected={selected} onChange={onChange} />
      </QueryClientProvider>,
    );
  };

  it('ticks the matching view permission when a manage permission is granted', async () => {
    const onChange = jest.fn();
    const { findByLabelText } = await renderPicker([], onChange);

    fireEvent.press(await findByLabelText('Add Meter Readings'));
    expect(onChange).toHaveBeenCalledWith(['METER_READING_CREATE', 'METER_READING_VIEW']);
  });

  it('grants or clears a whole module at once', async () => {
    const onChange = jest.fn();
    const { findByLabelText } = await renderPicker(['ISSUE_VIEW'], onChange);

    fireEvent.press(await findByLabelText('Issues & Escalations module'));
    expect(onChange).toHaveBeenCalledWith(['ISSUE_VIEW', 'ISSUE_MANAGE']);
  });
});

describe('SidebarNavigation left panel', () => {
  it('shows a join-code caretaker only Portfolio, Escalations, Finance & Billing and Settings', async () => {
    mockContext = contextWith({ accessType: 'CUSTOM_ACCESS', permissionCodes: CARETAKER_CODES });
    const { queryByText } = await render(<SidebarNavigation />);

    const visible = ALL_MODULE_LABELS.filter((label) => queryByText(label) !== null);
    expect(visible).toEqual(['Portfolio', 'Escalations', 'Finance & Billing', 'Settings']);
    expect(queryByText('UPGRADE PLAN')).toBeNull();
  });

  it('shows every module to a full-access owner', async () => {
    mockContext = contextWith({ accessType: 'FULL_ACCESS', title: 'Owner', permissionCodes: [] });
    const { queryByText } = await render(<SidebarNavigation />);

    expect(ALL_MODULE_LABELS.filter((label) => queryByText(label) === null)).toEqual([]);
    expect(queryByText('UPGRADE PLAN')).not.toBeNull();
  });
});
