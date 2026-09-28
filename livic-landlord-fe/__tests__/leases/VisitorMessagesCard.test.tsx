import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VisitorMessagesCard } from '../../src/features/leases/components/visiting-hours/VisitorMessagesCard';
import * as messageApi from '../../src/features/leases/api/tourMessageSettings.api';

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

jest.mock('../../src/features/leases/api/tourMessageSettings.api', () => ({
  getTourMessageSettings: jest.fn(),
  updateTourMessageSettings: jest.fn(),
}));

const api = messageApi as jest.Mocked<typeof messageApi>;

const defaults: messageApi.TourMessageSettings = {
  propertyId: 'prop-1',
  customized: false,
  decision: { sms: true, whatsapp: true },
  reminder: { sms: true, whatsapp: true },
  availableChannels: ['SMS', 'WHATSAPP'],
};

let queryClient: QueryClient | null = null;

async function renderCard() {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  await render(
    <QueryClientProvider client={queryClient}>
      <VisitorMessagesCard propertyId="prop-1" />
    </QueryClientProvider>
  );
  await screen.findByText('Visit approved or declined');
}

const channelSwitch = (message: string, channel: string) => screen.getByLabelText(`${message}: send by ${channel}`);

describe('VisitorMessagesCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient?.clear();
    queryClient = null;
  });

  it('shows the saved channels for each message', async () => {
    api.getTourMessageSettings.mockResolvedValue({ ...defaults, reminder: { sms: false, whatsapp: true } });
    await renderCard();

    expect(channelSwitch('Visit approved or declined', 'SMS').props.value).toBe(true);
    expect(channelSwitch('Visit reminder', 'SMS').props.value).toBe(false);
    expect(channelSwitch('Visit reminder', 'WhatsApp').props.value).toBe(true);
    expect(screen.getByText('Messages saved')).toBeTruthy();
  });

  it('saves the new choice, and says when a message goes nowhere', async () => {
    api.getTourMessageSettings.mockResolvedValue(defaults);
    api.updateTourMessageSettings.mockImplementation(async (_id, request) => ({ ...defaults, ...request, customized: true }));
    await renderCard();

    await fireEvent(channelSwitch('Visit reminder', 'SMS'), 'valueChange', false);
    await fireEvent(channelSwitch('Visit reminder', 'WhatsApp'), 'valueChange', false);
    expect(screen.getByText('Visitors won’t be messaged')).toBeTruthy();

    await fireEvent.press(screen.getByText('Save messages'));

    await waitFor(() =>
      expect(api.updateTourMessageSettings).toHaveBeenCalledWith(
        'prop-1',
        { decision: { sms: true, whatsapp: true }, reminder: { sms: false, whatsapp: false } },
        'mock-access-token'
      )
    );
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('Visitor messages saved', 'success'));
    expect(await screen.findByText('Messages saved')).toBeTruthy();
  });

  it('disables a channel that is not set up for the account', async () => {
    api.getTourMessageSettings.mockResolvedValue({ ...defaults, availableChannels: ['SMS'] });
    await renderCard();

    const whatsapp = channelSwitch('Visit approved or declined', 'WhatsApp');
    expect(whatsapp.props.disabled).toBe(true);
    expect(whatsapp.props.value).toBe(false);
    expect(screen.getAllByText('Not set up for your account yet')).toHaveLength(2);
  });

  it('never sends a channel that is not set up, even if it was on before', async () => {
    api.getTourMessageSettings.mockResolvedValue({ ...defaults, availableChannels: ['SMS'] });
    api.updateTourMessageSettings.mockImplementation(async (_id, request) => ({ ...defaults, ...request, customized: true }));
    await renderCard();

    await fireEvent(channelSwitch('Visit reminder', 'SMS'), 'valueChange', false);
    await fireEvent.press(screen.getByText('Save messages'));

    await waitFor(() =>
      expect(api.updateTourMessageSettings).toHaveBeenCalledWith(
        'prop-1',
        { decision: { sms: true, whatsapp: false }, reminder: { sms: false, whatsapp: false } },
        'mock-access-token'
      )
    );
  });
});
