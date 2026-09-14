import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TourRequestsPanel, matchesTourSearch } from '../../src/features/leases/components/TourRequestsPanel';
import * as tourApi from '../../src/features/leases/api/tourRequest.api';
import { ApiError } from '../../src/utils/errors';

const mockShowToast = jest.fn();

jest.mock('@/src/components/common/feedback/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast, hideToast: jest.fn() }),
}));

jest.mock('@/src/features/auth/context/AuthProvider', () => ({
  useAuth: () => ({ accessToken: 'mock-access-token', user: { id: 'user-123' } }),
}));

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

jest.mock('../../src/features/leases/api/tourRequest.api', () => ({
  ...jest.requireActual('../../src/features/leases/api/tourRequest.api'),
  listTourRequests: jest.fn(),
  getTourRequestSummary: jest.fn(),
  approveTourRequest: jest.fn(),
  rejectTourRequest: jest.fn(),
}));

const api = tourApi as jest.Mocked<typeof tourApi>;

const pendingTour: tourApi.TourRequestResponse = {
  id: 'lead-1',
  propertyId: 'prop-1',
  unitId: 'unit-1',
  unitNumber: '105',
  prospectName: 'Aditi Katiyar',
  prospectPhone: '9876543210',
  prospectEmail: 'aditi@example.com',
  preferredSlot: '2026-09-17T10:30:00Z',
  status: 'NEW',
  decisionNote: null,
  decidedAt: null,
  createdAt: '2026-09-14T21:38:24',
};

const secondTour: tourApi.TourRequestResponse = {
  ...pendingTour,
  id: 'lead-2',
  unitNumber: '210',
  prospectName: 'Rahul Verma',
  prospectPhone: '9123456789',
  prospectEmail: null,
};

function page(content: tourApi.TourRequestResponse[], totalPages = 1): tourApi.TourRequestPage {
  return { content, totalPages, totalElements: content.length, number: 0 };
}

async function renderPanel(props: Partial<React.ComponentProps<typeof TourRequestsPanel>> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <TourRequestsPanel propertyId="prop-1" isDesktop searchQuery="" {...props} />
    </QueryClientProvider>
  );
}

describe('TourRequestsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getTourRequestSummary.mockResolvedValue({ pending: 2, upcoming: 1 });
    api.listTourRequests.mockResolvedValue(page([pendingTour, secondTour]));
  });

  it('lists pending requests with prospect contact details, unit and status', async () => {
    await renderPanel();

    // Generous timeout: the first render in a cold Jest worker can exceed the 1s default
    expect(await screen.findByText('Aditi Katiyar', {}, { timeout: 5000 })).toBeTruthy();
    expect(screen.getByText('9876543210')).toBeTruthy();
    expect(screen.getByText('aditi@example.com')).toBeTruthy();
    expect(screen.getByText('Unit 105')).toBeTruthy();
    expect(screen.getAllByText('PENDING').length).toBe(2);
    expect(api.listTourRequests).toHaveBeenCalledWith('prop-1', 'PENDING', 0, 'mock-access-token');
  });

  it('shows the pending and upcoming counts on the filter pills and switches filters', async () => {
    await renderPanel();
    await screen.findByText('Aditi Katiyar');

    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();

    api.listTourRequests.mockResolvedValue(page([]));
    await fireEvent.press(screen.getByText('Past'));

    await waitFor(() => expect(api.listTourRequests).toHaveBeenCalledWith('prop-1', 'PAST', 0, 'mock-access-token'));
    expect(await screen.findByText('No past tour requests')).toBeTruthy();
  });

  it('opens the dialer when the phone number is tapped', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await renderPanel();

    await fireEvent.press(await screen.findByLabelText('Call Aditi Katiyar at 9876543210'));

    expect(openURL).toHaveBeenCalledWith('tel:9876543210');
  });

  it('approves a request and refreshes the list', async () => {
    api.approveTourRequest.mockResolvedValue({ ...pendingTour, status: 'APPROVED' });
    await renderPanel();
    await screen.findByText('Aditi Katiyar');

    await fireEvent.press(screen.getAllByText('Approve')[0]);

    await waitFor(() => expect(api.approveTourRequest).toHaveBeenCalledWith('lead-1', 'mock-access-token'));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('Tour approved for Aditi Katiyar', 'success'));
    await waitFor(() => expect(api.listTourRequests.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('rejects a request with the note entered in the dialog', async () => {
    api.rejectTourRequest.mockResolvedValue({ ...pendingTour, status: 'REJECTED', decisionNote: 'Room under renovation' });
    await renderPanel();
    await screen.findByText('Aditi Katiyar');

    await fireEvent.press(screen.getAllByText('Reject')[0]);
    expect(await screen.findByText('Decline visit request')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Rejection note'), '  Room under renovation  ');
    await fireEvent.press(screen.getByLabelText('Reject request'));

    await waitFor(() => expect(api.rejectTourRequest).toHaveBeenCalledWith('lead-1', 'Room under renovation', 'mock-access-token'));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('Tour request from Aditi Katiyar declined', 'success'));
  });

  it('shows the server reason and resyncs when the request was already handled (409)', async () => {
    api.approveTourRequest.mockRejectedValue(
      new ApiError('This tour request can no longer be approved (current status: CANCELLED)', 409)
    );
    await renderPanel();
    await screen.findByText('Aditi Katiyar');

    await fireEvent.press(screen.getAllByText('Approve')[0]);

    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith(
      'This tour request can no longer be approved (current status: CANCELLED)', 'warning'
    ));
    await waitFor(() => expect(api.listTourRequests.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('filters the loaded page by the page search text', async () => {
    await renderPanel({ searchQuery: '9123' });

    expect(await screen.findByText('Rahul Verma')).toBeTruthy();
    expect(screen.queryByText('Aditi Katiyar')).toBeNull();
  });

  it('asks for a property when none is selected', async () => {
    await renderPanel({ propertyId: null });

    expect(screen.getByText('Select a property')).toBeTruthy();
    expect(api.listTourRequests).not.toHaveBeenCalled();
  });

  it('matches search on name, phone, email and unit', () => {
    expect(matchesTourSearch(pendingTour, 'aditi')).toBe(true);
    expect(matchesTourSearch(pendingTour, '98765')).toBe(true);
    expect(matchesTourSearch(pendingTour, 'example.com')).toBe(true);
    expect(matchesTourSearch(pendingTour, '105')).toBe(true);
    expect(matchesTourSearch(pendingTour, 'zzz')).toBe(false);
  });
});
