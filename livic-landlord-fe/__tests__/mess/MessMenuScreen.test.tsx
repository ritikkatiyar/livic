import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MessMenuScreen from '../../src/features/mess/screens/MessMenuScreen';
import * as messApi from '../../src/features/mess/api/messMenu.api';
import { DAYS_OF_WEEK } from '../../src/utils/weekdays';

const mockShowToast = jest.fn();
const mockCan = jest.fn();
let mockSelectedPropertyId: string | null = 'prop-1';

jest.mock('@/src/components/common/feedback/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast, hideToast: jest.fn() }),
}));

jest.mock('@/src/features/auth/context/AuthProvider', () => ({
  useAuth: () => ({ accessToken: 'mock-access-token', user: { id: 'user-123' } }),
}));

jest.mock('@/src/features/auth/hooks/usePermissions', () => ({
  usePermissions: () => ({ isLoaded: true, can: mockCan, canRoute: () => true }),
}));

jest.mock('@/src/hooks/useProperties', () => ({
  useProperties: () => ({ properties: [{ id: 'prop-1', name: "Mom's PG" }], isLoading: false }),
}));

jest.mock('@/src/context/PropertySelectionContext', () => ({
  useGlobalPropertySelection: () => ({ selectedPropertyId: mockSelectedPropertyId, setSelectedPropertyId: jest.fn() }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), canGoBack: () => true, replace: jest.fn() }),
}));

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

// The real dropdown renders every time option behind a Modal for each field
jest.mock('@/src/components/common/inputs/GlassDropdown', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ value, placeholder }: { value: string | null; placeholder?: string }) => <Text>{value || placeholder}</Text>,
  };
});

// A fixed "today" keeps the day chips stable whatever day the suite runs
jest.mock('@/src/utils/weekdays', () => ({
  ...jest.requireActual('@/src/utils/weekdays'),
  todayDayOfWeek: () => 'MONDAY',
}));

jest.mock('../../src/features/mess/api/messMenu.api', () => ({
  ...jest.requireActual('../../src/features/mess/api/messMenu.api'),
  getMessMenu: jest.fn(),
  updateMessSettings: jest.fn(),
  updateMealSlots: jest.fn(),
  updateWeekMenu: jest.fn(),
}));

const api = messApi as jest.Mocked<typeof messApi>;

jest.setTimeout(20000);

const menu: messApi.MessMenu = {
  propertyId: 'prop-1',
  enabled: false,
  slots: [
    { id: 'breakfast', name: 'Breakfast', startTime: '07:30', endTime: '09:30' },
    { id: 'dinner', name: 'Dinner', startTime: null, endTime: null },
  ],
  days: DAYS_OF_WEEK.map((dayOfWeek) => ({
    dayOfWeek,
    note: null,
    meals: [
      { slotId: 'breakfast', items: dayOfWeek === 'MONDAY' ? [{ id: 'i1', name: 'Poha', dietType: 'VEG' as const }] : [] },
      { slotId: 'dinner', items: [] },
    ],
  })),
};

let queryClient: QueryClient | null = null;

async function renderScreen() {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MessMenuScreen />
    </QueryClientProvider>
  );
}

describe('MessMenuScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectedPropertyId = 'prop-1';
    mockCan.mockReturnValue(true);
    api.getMessMenu.mockResolvedValue(menu);
    api.updateWeekMenu.mockImplementation(async () => menu);
    api.updateMessSettings.mockImplementation(async (_propertyId, enabled) => ({ ...menu, enabled }));
    api.updateMealSlots.mockImplementation(async () => menu);
  });

  afterEach(() => {
    queryClient?.clear();
    queryClient = null;
  });

  it('asks for a property when none is selected', async () => {
    mockSelectedPropertyId = null;
    await renderScreen();

    expect(screen.getByText('Select a property for its mess menu')).toBeTruthy();
    expect(api.getMessMenu).not.toHaveBeenCalled();
  });

  it("opens on today's menu with saving disabled until something changes", async () => {
    await renderScreen();

    expect(await screen.findByText('Weekly menu', {}, { timeout: 15000 })).toBeTruthy();
    expect(screen.getByText('Monday')).toBeTruthy();
    expect(screen.getByDisplayValue('Poha')).toBeTruthy();
    expect(screen.getByText('7:30 AM – 9:30 AM')).toBeTruthy();
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(screen.queryByText('Unsaved changes')).toBeNull();
  });

  it('adds a tagged dish and saves the week', async () => {
    await renderScreen();
    await screen.findByText('Weekly menu', {}, { timeout: 15000 });

    fireEvent.changeText(screen.getByLabelText('New dish for Dinner'), 'Egg curry');
    await screen.findByDisplayValue('Egg curry');
    fireEvent.press(screen.getByLabelText('Add dish to Dinner'));
    fireEvent.press(await screen.findByLabelText('Egg curry: Egg'));
    expect(await screen.findByText('Unsaved changes')).toBeTruthy();

    fireEvent.press(screen.getByText('Save menu'));

    await waitFor(() => expect(api.updateWeekMenu).toHaveBeenCalledTimes(1));
    const [propertyId, request] = api.updateWeekMenu.mock.calls[0];
    expect(propertyId).toBe('prop-1');
    expect(request.days[0]).toEqual({
      dayOfWeek: 'MONDAY',
      note: null,
      meals: [
        { slotId: 'breakfast', items: [{ name: 'Poha', dietType: 'VEG' }] },
        { slotId: 'dinner', items: [{ name: 'Egg curry', dietType: 'EGG' }] },
      ],
    });
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('Menu saved', 'success'));
  });

  it('shows the menu to residents when switched on', async () => {
    await renderScreen();
    await screen.findByText('Weekly menu', {}, { timeout: 15000 });

    fireEvent(screen.getByLabelText('Show menu to residents'), 'valueChange', true);

    await waitFor(() => expect(api.updateMessSettings).toHaveBeenCalledWith('prop-1', true, 'mock-access-token'));
  });

  it('is read-only for staff without mess access', async () => {
    mockCan.mockReturnValue(false);
    await renderScreen();
    await screen.findByText('Weekly menu', {}, { timeout: 15000 });

    expect(screen.getByText(/You can view this menu/)).toBeTruthy();
    expect(screen.getByText('Poha')).toBeTruthy();
    expect(screen.queryByLabelText('New dish for Dinner')).toBeNull();
    expect(screen.queryByText('Save menu')).toBeNull();
    expect(screen.queryByText('Edit meals')).toBeNull();
  });

  it('sets up the suggested meals when the property has none', async () => {
    api.getMessMenu.mockResolvedValue({ ...menu, slots: [], days: menu.days.map((d) => ({ ...d, meals: [] })) });
    await renderScreen();

    fireEvent.press(await screen.findByText('Set up meals', {}, { timeout: 15000 }));
    fireEvent.press(await screen.findByText('Use Breakfast, Lunch, Snacks and Dinner'));
    await screen.findByDisplayValue('Evening snacks');
    fireEvent.press(screen.getByText('Save meals'));

    await waitFor(() => expect(api.updateMealSlots).toHaveBeenCalledTimes(1));
    expect(api.updateMealSlots.mock.calls[0][1].map((s) => s.name)).toEqual(['Breakfast', 'Lunch', 'Evening snacks', 'Dinner']);
  });
});
