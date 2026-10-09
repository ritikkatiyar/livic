import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TenantMessScreen from '../../src/features/mess/screens/TenantMessScreen';
import { TodayMenuCard } from '../../src/features/mess/components/TodayMenuCard';
import * as messApi from '../../src/features/mess/api/messMenu.api';
import { DAYS_OF_WEEK } from '../../src/features/mess/utils/messMenu';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

jest.mock('@/src/features/auth/context/AuthProvider', () => ({
  useAuth: () => ({ accessToken: 'token', user: { id: 'user-1' } }),
}));

// A fixed "today" keeps the day chips stable whatever day the suite runs
jest.mock('@/src/features/mess/utils/messMenu', () => ({
  ...jest.requireActual('@/src/features/mess/utils/messMenu'),
  todayDayOfWeek: () => 'SUNDAY',
}));

jest.mock('../../src/features/mess/api/messMenu.api', () => ({
  getMyMessMenu: jest.fn(),
}));

const api = messApi as jest.Mocked<typeof messApi>;

jest.setTimeout(20000);

const menu: messApi.MessMenu = {
  propertyId: 'prop-1',
  enabled: true,
  slots: [
    { id: 'lunch', name: 'Lunch', startTime: '12:30:00', endTime: '14:30:00' },
    { id: 'dinner', name: 'Dinner', startTime: null, endTime: null },
  ],
  days: DAYS_OF_WEEK.map((dayOfWeek) => ({
    dayOfWeek,
    note: dayOfWeek === 'SUNDAY' ? 'Sunday special' : null,
    meals: [
      {
        slotId: 'lunch',
        items: dayOfWeek === 'SUNDAY'
          ? [{ id: 'i1', name: 'Chicken biryani with raita and salan', dietType: 'NON_VEG' as const }]
          : [{ id: `i-${dayOfWeek}`, name: `Dal rice (${dayOfWeek.toLowerCase()})`, dietType: 'VEG' as const }],
      },
      { slotId: 'dinner', items: [] },
    ],
  })),
};

let queryClient: QueryClient | null = null;

function renderWithQuery(ui: React.ReactElement) {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('TenantMessScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getMyMessMenu.mockResolvedValue(menu);
  });

  afterEach(() => {
    queryClient?.clear();
    queryClient = null;
  });

  it("opens on today's menu with its note and meal times", async () => {
    await renderWithQuery(<TenantMessScreen />);

    expect(await screen.findByText('Sunday special', {}, { timeout: 15000 })).toBeTruthy();
    expect(screen.getByText('Sun · Today')).toBeTruthy();
    expect(screen.getByText('Chicken biryani with raita and salan')).toBeTruthy();
    expect(screen.getByLabelText('Non-veg')).toBeTruthy();
    expect(screen.getByText('12:30 PM – 2:30 PM')).toBeTruthy();
    expect(screen.getByText('Not on the menu')).toBeTruthy();
  });

  it('switches to another day', async () => {
    await renderWithQuery(<TenantMessScreen />);
    await screen.findByText('Sunday special', {}, { timeout: 15000 });

    fireEvent.press(screen.getByText('Tue'));

    expect(await screen.findByText('Dal rice (tuesday)')).toBeTruthy();
    expect(screen.queryByText('Sunday special')).toBeNull();
  });

  it("explains when the property doesn't share a menu", async () => {
    api.getMyMessMenu.mockResolvedValue({ propertyId: null, enabled: false, slots: [], days: [] });
    await renderWithQuery(<TenantMessScreen />);

    expect(await screen.findByText('No mess menu yet', {}, { timeout: 15000 })).toBeTruthy();
  });

  it('offers a retry when the menu fails to load', async () => {
    api.getMyMessMenu.mockRejectedValueOnce(new Error('Network down')).mockResolvedValue(menu);
    await renderWithQuery(<TenantMessScreen />);

    fireEvent.press(await screen.findByText('Try again', {}, { timeout: 15000 }));

    expect(await screen.findByText('Sunday special')).toBeTruthy();
  });
});

describe('TodayMenuCard', () => {
  afterEach(() => {
    queryClient?.clear();
    queryClient = null;
  });

  it("shows today's dishes and links to the full week", async () => {
    api.getMyMessMenu.mockResolvedValue(menu);
    await renderWithQuery(<TodayMenuCard token="token" />);

    expect(await screen.findByText('Chicken biryani with raita and salan', {}, { timeout: 15000 })).toBeTruthy();
    // Meals with nothing on them are left off the compact card
    expect(screen.queryByText('Dinner')).toBeNull();

    fireEvent.press(screen.getByText('See full week'));
    expect(mockPush).toHaveBeenCalledWith('/tenant-mess');
  });

  it('stays hidden when the property has no mess menu', async () => {
    api.getMyMessMenu.mockResolvedValue({ propertyId: null, enabled: false, slots: [], days: [] });
    await renderWithQuery(<TodayMenuCard token="token" />);

    await waitFor(() => expect(queryClient?.getQueryState(['myMessMenu', 'token'])?.status).toBe('success'));
    expect(screen.queryByTestId('today-menu-card')).toBeNull();
    expect(api.getMyMessMenu).toHaveBeenCalledWith('token');
  });
});
