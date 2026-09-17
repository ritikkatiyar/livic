import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import VisitingHoursScreen from '../../src/features/leases/screens/VisitingHoursScreen';
import * as availabilityApi from '../../src/features/leases/api/tourAvailability.api';

const mockShowToast = jest.fn();

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
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), canGoBack: () => true, replace: jest.fn() }),
}));

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

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

jest.setTimeout(20000);

/** Only Monday open, so the screen renders quickly. */
const mondayOnly: availabilityApi.TourAvailability = {
  propertyId: 'prop-1',
  customized: true,
  timezone: 'Asia/Kolkata',
  slotMinutes: 60,
  minNoticeMinutes: 60,
  bookingWindowDays: 14,
  maxVisitorsPerSlot: null,
  weeklyHours: availabilityApi.DAYS_OF_WEEK.map((dayOfWeek) => ({
    dayOfWeek,
    windows: dayOfWeek === 'MONDAY' ? [{ start: '10:00', end: '13:00' }] : [],
  })),
  blackouts: [],
};

let queryClient: QueryClient | null = null;

async function renderScreen() {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const view = await render(
    <QueryClientProvider client={queryClient}>
      <VisitingHoursScreen propertyId="prop-1" />
    </QueryClientProvider>
  );
  await screen.findByText('Weekly visiting hours', {}, { timeout: 15000 });
  return view;
}

describe('VisitingHoursScreen blocked dates and save failures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getTourAvailability.mockResolvedValue(mondayOnly);
    api.getTourSlotsPreview.mockResolvedValue({ propertyId: 'prop-1', timezone: 'Asia/Kolkata', slotMinutes: 60, days: [] });
  });

  afterEach(() => {
    queryClient?.clear();
    queryClient = null;
  });

  it('blocks a whole day and removes an existing blocked date', async () => {
    api.getTourAvailability.mockResolvedValue({
      ...mondayOnly,
      blackouts: [{ id: 'bo-1', date: '2026-10-02', startTime: null, endTime: null, reason: 'Festival' }],
    });
    api.addTourBlackout.mockResolvedValue({ id: 'bo-2', date: '2026-09-20', startTime: null, endTime: null, reason: null });
    await renderScreen();

    expect(screen.getByText('All day · Festival')).toBeTruthy();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const label = tomorrow.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    fireEvent.press(screen.getByLabelText(label));
    fireEvent.press(await screen.findByText(`Block ${label}`));

    await waitFor(() => expect(api.addTourBlackout).toHaveBeenCalledWith(
      'prop-1',
      expect.objectContaining({ startTime: null, endTime: null, reason: null }),
      'mock-access-token'
    ));

    fireEvent.press(screen.getByLabelText('Unblock Fri, 2 Oct'));
    await waitFor(() => expect(api.deleteTourBlackout).toHaveBeenCalledWith('bo-1', 'mock-access-token'));
  });

  it('keeps the edits when the server rejects the save', async () => {
    api.updateTourAvailability.mockRejectedValue(new Error('Time windows on Monday overlap'));
    await renderScreen();

    fireEvent(screen.getByLabelText('Monday open for visits'), 'valueChange', false);
    fireEvent.press(await screen.findByText('Save changes'));

    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('Time windows on Monday overlap', 'error'));
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
  });
});
