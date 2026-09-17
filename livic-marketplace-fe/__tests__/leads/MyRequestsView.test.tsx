import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ApiError } from '@/api/client';
import * as api from '@/api/marketplace';
import { MyRequestsView } from '@/components/leads/MyRequestsView';
import { saveOtpSession } from '@/features/leads/otpSessionStorage';
import { MyTourRequest } from '@/types/lead';

jest.mock('@/api/marketplace', () => ({
  requestOtp: jest.fn(),
  verifyOtp: jest.fn(),
  getMyTourRequests: jest.fn(),
  cancelMyTourRequest: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

const pendingRequest: MyTourRequest = {
  id: 'lead-1',
  propertyId: 'prop-1',
  propertyName: 'Livic Residency',
  propertyAddress: '12 MG Road',
  propertyCity: 'Bengaluru',
  unitId: 'unit-1',
  unitNumber: '101',
  preferredSlot: '2099-01-15T05:30:00Z',
  status: 'NEW',
  decisionNote: null,
  decidedAt: null,
  cancellable: true,
  createdAt: '2026-09-14T09:00:00Z',
};

const declinedRequest: MyTourRequest = {
  ...pendingRequest,
  id: 'lead-2',
  propertyName: "Mom's PG",
  status: 'REJECTED',
  decisionNote: 'Room under maintenance that week',
  cancellable: false,
};

function pageOf(items: MyTourRequest[], page = 1, totalPages = 1) {
  return { success: true, data: { items, page, pageSize: 10, totalItems: items.length, totalPages } };
}

describe('MyRequestsView', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.sessionStorage.clear();
    mockedApi.requestOtp.mockResolvedValue({ success: true, data: { success: true, message: 'sent', resendAfterSeconds: 60 } });
    mockedApi.verifyOtp.mockResolvedValue({ success: true, data: { otpSessionToken: 'session-1', expiresAt: '2099-01-01T00:00:00Z' } });
  });

  it('verifies the phone with an OTP and then lists the requests', async () => {
    mockedApi.getMyTourRequests.mockResolvedValue(pageOf([pendingRequest, declinedRequest]));
    render(<MyRequestsView page={1} />);

    const phoneInput = await screen.findByLabelText(/Mobile Number/i);
    fireEvent.change(phoneInput, { target: { value: '12345' } });
    fireEvent.click(screen.getByRole('button', { name: /Send verification code/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/valid 10-digit/i);
    expect(mockedApi.requestOtp).not.toHaveBeenCalled();

    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: /Send verification code/i }));
    fireEvent.change(await screen.findByPlaceholderText('000000'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify Code/i }));

    expect(await screen.findByText('Livic Residency')).toBeInTheDocument();
    expect(mockedApi.verifyOtp).toHaveBeenCalledWith('9876543210', '000000');
    expect(mockedApi.getMyTourRequests).toHaveBeenCalledWith('session-1', 1);
    expect(screen.getByText(/••••••3210/)).toBeInTheDocument();

    const declined = screen.getByRole('article', { name: /Mom's PG/ });
    expect(within(declined).getByText('Declined')).toBeInTheDocument();
    expect(within(declined).getByText('Room under maintenance that week')).toBeInTheDocument();
    expect(within(declined).queryByRole('button', { name: /Cancel visit/i })).not.toBeInTheDocument();
  });

  it('skips verification when the phone was verified earlier in this tab', async () => {
    saveOtpSession('stored-token', '9876543210');
    mockedApi.getMyTourRequests.mockResolvedValue(pageOf([], 1, 0));
    render(<MyRequestsView page={1} />);

    expect(await screen.findByText(/No tour requests yet/i)).toBeInTheDocument();
    expect(mockedApi.getMyTourRequests).toHaveBeenCalledWith('stored-token', 1);
    expect(mockedApi.requestOtp).not.toHaveBeenCalled();
  });

  it('cancels a pending visit after confirmation', async () => {
    saveOtpSession('stored-token', '9876543210');
    mockedApi.getMyTourRequests.mockResolvedValue(pageOf([pendingRequest]));
    mockedApi.cancelMyTourRequest.mockResolvedValue({ success: true, data: { ...pendingRequest, status: 'CANCELLED', cancellable: false } });
    render(<MyRequestsView page={1} />);

    fireEvent.click(await screen.findByRole('button', { name: /Cancel visit/i }));
    fireEvent.click(screen.getByRole('button', { name: /Keep it/i }));
    expect(mockedApi.cancelMyTourRequest).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Cancel visit/i }));
    fireEvent.click(screen.getByRole('button', { name: /Yes, cancel/i }));

    expect(await screen.findByText(/Your visit has been cancelled/i)).toBeInTheDocument();
    expect(mockedApi.cancelMyTourRequest).toHaveBeenCalledWith('stored-token', 'lead-1');
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cancel visit/i })).not.toBeInTheDocument();
  });

  it('reloads the list when the visit can no longer be cancelled', async () => {
    saveOtpSession('stored-token', '9876543210');
    mockedApi.getMyTourRequests
      .mockResolvedValueOnce(pageOf([pendingRequest]))
      .mockResolvedValueOnce(pageOf([{ ...pendingRequest, status: 'APPROVED', cancellable: false }]));
    mockedApi.cancelMyTourRequest.mockRejectedValue(new ApiError('This tour request can no longer be cancelled', 'CONFLICT', undefined, 409));
    render(<MyRequestsView page={1} />);

    fireEvent.click(await screen.findByRole('button', { name: /Cancel visit/i }));
    fireEvent.click(screen.getByRole('button', { name: /Yes, cancel/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('This tour request can no longer be cancelled');
    expect(await screen.findByText('Approved')).toBeInTheDocument();
    expect(mockedApi.getMyTourRequests).toHaveBeenCalledTimes(2);
  });

  it('asks for verification again when the session has expired', async () => {
    saveOtpSession('stale-token', '9876543210');
    mockedApi.getMyTourRequests.mockRejectedValue(new Error('OTP session has expired'));
    render(<MyRequestsView page={1} />);

    expect(await screen.findByText(/verification has expired/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mobile Number/i)).toBeInTheDocument();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('shows load errors with a retry', async () => {
    saveOtpSession('stored-token', '9876543210');
    mockedApi.getMyTourRequests.mockRejectedValueOnce(new Error('Service unavailable')).mockResolvedValueOnce(pageOf([pendingRequest]));
    render(<MyRequestsView page={1} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable');
    fireEvent.click(screen.getByRole('button', { name: /Try again/i }));

    expect(await screen.findByText('Livic Residency')).toBeInTheDocument();
  });

  it('requests the page from the URL and lets the prospect switch numbers', async () => {
    saveOtpSession('stored-token', '9876543210');
    mockedApi.getMyTourRequests.mockResolvedValue(pageOf([pendingRequest], 2, 3));
    render(<MyRequestsView page={2} />);

    expect(await screen.findByText('Livic Residency')).toBeInTheDocument();
    expect(mockedApi.getMyTourRequests).toHaveBeenCalledWith('stored-token', 2);

    fireEvent.click(screen.getByRole('button', { name: /Use a different number/i }));
    await waitFor(() => expect(screen.getByLabelText(/Mobile Number/i)).toHaveValue(''));
    expect(window.sessionStorage.length).toBe(0);
  });
});
