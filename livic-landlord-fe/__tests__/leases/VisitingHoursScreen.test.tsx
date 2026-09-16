import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import VisitingHoursScreen from '../../src/features/leases/screens/VisitingHoursScreen';
import * as availabilityApi from '../../src/features/leases/api/tourAvailability.api';

const mockShowToast = jest.fn();
const mockPush = jest.fn();

jest.mock('@/src/components/common/feedback/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast, hideToast: jest.fn() }),
}));

jest.mock('@/src/features/auth/context/AuthProvider', () => ({
  useAuth: () => ({ accessToken: 'mock-access-token', user: { id: 'user-123' } }),
}));

jest.mock('@/src/hooks/useProperties', () => ({
  useProperties: () => ({ properties: [{ id: 'prop-1', name: "Mom's PG" }], isLoading: false }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), canGoBack: () => true, replace: jest.fn() }),
}));

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

// The real dropdown renders 48 time options behind a Modal for every time field, which makes this suite crawl
jest.mock('@/src/components/common/inputs/GlassDropdown', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ value, placeholder }: { value: string | null; placeholder?: string }) => <Text>{value ?? placeholder}</Text>,
  };
});

jest.mock('../../src/features/leases/api/tourAvailability.api', () => ({
  ...jest.requireActual('../../src/features/leases/api/tourAvailability.api'),
  getTourAvailability: jest.fn(),
  updateTourAvailability: jest.fn(),
  addTourBlackout: jest.fn(),
  deleteTourBlackout: jest.fn(),
  getTourSlotsPreview: jest.fn(),
}));

const api = availabilityApi as jest.Mocked<typeof availabilityApi>;

// This screen renders four cards with long dropdown lists; a cold Jest worker needs more than the 5s default
jest.setTimeout(20000);

const defaults: availabilityApi.TourAvailability = {
  propertyId: 'prop-1',
  customized: false,
  timezone: 'Asia/Kolkata',
  slotMinutes: 60,
  minNoticeMinutes: 60,
  bookingWindowDays: 14,
  maxVisitorsPerSlot: null,
  weeklyHours: availabilityApi.DAYS_OF_WEEK.map((dayOfWeek) => ({ dayOfWeek, windows: [{ start: '09:00', end: '20:00' }] })),
  blackouts: [],
};

/** Only Monday open: each open day renders two long time dropdowns, so this keeps heavier cases fast. */
const mondayOnly: availabilityApi.TourAvailability = {
  ...defaults,
  customized: true,
  weeklyHours: availabilityApi.DAYS_OF_WEEK.map((dayOfWeek) => ({
    dayOfWeek,
    windows: dayOfWeek === 'MONDAY' ? [{ start: '10:00', end: '13:00' }] : [],
  })),
};

const emptyPreview: availabilityApi.TourSlots = {
  propertyId: 'prop-1',
  timezone: 'Asia/Kolkata',
  slotMinutes: 60,
  days: [],
};

let queryClient: QueryClient | null = null;

async function renderScreen() {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const view = await render(
    <QueryClientProvider client={queryClient}>
      <VisitingHoursScreen propertyId="prop-1" />
    </QueryClientProvider>
  );
  // Generous timeout: the first render in a cold Jest worker can exceed the 1s default
  await screen.findByText('Weekly visiting hours', {}, { timeout: 15000 });
  return view;
}

describe('VisitingHoursScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getTourAvailability.mockResolvedValue(defaults);
    api.getTourSlotsPreview.mockResolvedValue(emptyPreview);
    api.updateTourAvailability.mockImplementation(async (_propertyId, request) => ({
      ...defaults,
      ...request,
      customized: true,
      blackouts: [],
    }));
  });

  afterEach(() => {
    // Query caches keep this screen's four cards subscribed; without this the suite slows down test by test
    queryClient?.clear();
    queryClient = null;
  });

  it('shows the default hours with a nudge, and saving is disabled until something changes', async () => {
    await renderScreen();

    expect(screen.getByText(/You're using the default hours/)).toBeTruthy();
    expect(screen.getAllByText('11 slots').length).toBe(7);
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(screen.queryByText('Unsaved changes')).toBeNull();
  });

  it('opens a day and saves the new week', async () => {
    api.getTourAvailability.mockResolvedValue(mondayOnly);
    await renderScreen();

    fireEvent(screen.getByLabelText('Saturday open for visits'), 'valueChange', true);

    expect(await screen.findByText('Unsaved changes')).toBeTruthy();
    fireEvent.press(screen.getByText('Save changes'));

    await waitFor(() => expect(api.updateTourAvailability).toHaveBeenCalledTimes(1));
    const [, request] = api.updateTourAvailability.mock.calls[0];
    expect(request.weeklyHours.find((d) => d.dayOfWeek === 'SATURDAY')?.windows).toEqual([{ start: '10:00', end: '13:00' }]);
    expect(request.weeklyHours.find((d) => d.dayOfWeek === 'SUNDAY')?.windows).toEqual([]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('Visiting hours saved', 'success'));
    await waitFor(() => expect(screen.queryByText('Unsaved changes')).toBeNull());
  });

  it('adds a second time range to a day and keeps the slot count in step', async () => {
    api.getTourAvailability.mockResolvedValue(mondayOnly);
    await renderScreen();

    fireEvent.press(screen.getByLabelText('Add a time range on Monday'));

    // 10:00-13:00 (3 slots) plus the suggested 14:00-16:00 range (2 slots)
    expect(await screen.findByText('5 slots')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Remove Monday time range 2'));
    await waitFor(() => expect(screen.getByText('3 slots')).toBeTruthy());
  });

  it('refuses to save a day whose range is shorter than the visit length', async () => {
    api.getTourAvailability.mockResolvedValue({
      ...mondayOnly,
      slotMinutes: 30,
      weeklyHours: mondayOnly.weeklyHours.map((d) => (d.dayOfWeek === 'MONDAY' ? { ...d, windows: [{ start: '10:00', end: '10:30' }] } : d)),
    });
    await renderScreen();

    fireEvent.press(screen.getByLabelText('60 min'));

    expect(await screen.findByText('Each time range must be at least 60 minutes')).toBeTruthy();
    fireEvent.press(screen.getByText('Save changes'));
    expect(api.updateTourAvailability).not.toHaveBeenCalled();
  });

  it('copies Monday to the weekdays and leaves the weekend alone', async () => {
    api.getTourAvailability.mockResolvedValue(mondayOnly);
    await renderScreen();

    fireEvent.press(screen.getByLabelText('Copy Monday\'s hours to Tuesday to Friday'));
    fireEvent.press(await screen.findByText('Save changes'));

    await waitFor(() => expect(api.updateTourAvailability).toHaveBeenCalled());
    const [, request] = api.updateTourAvailability.mock.calls[0];
    expect(request.weeklyHours.find((d) => d.dayOfWeek === 'FRIDAY')?.windows).toEqual([{ start: '10:00', end: '13:00' }]);
    expect(request.weeklyHours.find((d) => d.dayOfWeek === 'SATURDAY')?.windows).toEqual([]);
  });

  it('changes a booking rule and sends it with the save', async () => {
    api.getTourAvailability.mockResolvedValue(mondayOnly);
    await renderScreen();

    fireEvent.press(screen.getByLabelText('30 min'));
    fireEvent.press(screen.getByLabelText('7 days'));
    fireEvent.press(await screen.findByText('Save changes'));

    await waitFor(() => expect(api.updateTourAvailability).toHaveBeenCalled());
    const [, request] = api.updateTourAvailability.mock.calls[0];
    expect(request.slotMinutes).toBe(30);
    expect(request.bookingWindowDays).toBe(7);
  });

});
