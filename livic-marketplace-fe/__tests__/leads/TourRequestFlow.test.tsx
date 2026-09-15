import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RoomConversionContainer } from '@/components/booking/RoomConversionContainer';
import { TourRequestForm } from '@/components/booking/TourRequestForm';
import { toLocalIsoDate, toLocalSlot } from '@/utils/visitSlots';
import { ApiError, parseErrorBody } from '@/api/client';
import { saveOtpSession } from '@/features/leads/otpSessionStorage';
import * as api from '@/api/marketplace';
import { PropertyDetail } from '@/types/property';
import { UnitSummary } from '@/types/unit';

jest.mock('@/api/marketplace', () => ({
  requestOtp: jest.fn(),
  verifyOtp: jest.fn(),
  createLead: jest.fn(),
  getDeclinedTourSlots: jest.fn(),
  initiateTokenPayment: jest.fn(),
}));

const mockedApi = api as jest.Mocked<typeof api>;

const property: PropertyDetail = {
  id: 'prop-1',
  name: 'Test Residency',
  city: 'Bengaluru',
  propertyType: 'RENTAL',
  address: '1 Test Road',
  totalFloors: 2,
  amenities: [],
  images: [],
  totalUnitsCount: 1,
  availableUnitsCount: 1,
};

const unit: UnitSummary = {
  id: 'unit-1',
  unitNumber: '101',
  type: '1 BHK',
  capacity: 2,
  basePrice: 15000,
  isBookable: true,
};

const fullDate = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const dateOption = (year: number, monthIndex: number, day: number) =>
  screen.getByRole('radio', { name: fullDate.format(new Date(year, monthIndex, day)) });
const timeOption = (label: string) => screen.getByRole('radio', { name: label });

/** Fake only `Date`; real timers keep react-hook-form and waitFor working. */
function pinClock(now: Date) {
  jest.useFakeTimers({
    now,
    doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask'],
  });
}

async function fillTourForm({ phone = '9876543210' } = {}) {
  fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Test Visitor' } });
  fireEvent.change(screen.getByLabelText(/Mobile Number/i), { target: { value: phone } });
  await screen.findByRole('radiogroup', { name: 'Preferred Visit Date' });
}

describe('TourRequestForm date & time pickers', () => {
  beforeEach(() => pinClock(new Date(2026, 8, 14, 15, 30))); // Mon 14 Sep 2026, 3:30 PM local
  afterEach(() => jest.useRealTimers());

  it('preselects tomorrow at 11:00 AM', async () => {
    render(<TourRequestForm onSubmitLead={jest.fn()} loading={false} />);
    await screen.findByRole('radiogroup', { name: 'Preferred Visit Date' });

    expect(dateOption(2026, 8, 15)).toHaveAttribute('aria-checked', 'true');
    expect(timeOption('11:00 AM')).toHaveAttribute('aria-checked', 'true');
  });

  it('sends the chosen date and time as a local-time ISO slot', async () => {
    const onSubmitLead = jest.fn();
    render(<TourRequestForm onSubmitLead={onSubmitLead} loading={false} />);
    await fillTourForm();

    fireEvent.click(dateOption(2026, 8, 16));
    fireEvent.click(timeOption('4:00 PM'));
    fireEvent.click(screen.getByRole('button', { name: /Continue to OTP Verification/i }));

    await waitFor(() => expect(onSubmitLead).toHaveBeenCalledTimes(1));
    expect(onSubmitLead.mock.calls[0][0]).toMatchObject({
      leadType: 'TOUR_REQUEST',
      prospectName: 'Test Visitor',
      prospectPhone: '9876543210',
      preferredSlot: toLocalSlot('2026-09-16', '16:00').toISOString(),
    });
  });

  it('disables slots that have passed today and moves the selection to the next open one', async () => {
    render(<TourRequestForm onSubmitLead={jest.fn()} loading={false} />);
    await screen.findByRole('radiogroup', { name: 'Preferred Visit Date' });

    fireEvent.click(dateOption(2026, 8, 14));

    expect(timeOption('3:00 PM')).toBeDisabled();
    expect(timeOption('4:00 PM')).toBeEnabled();
    expect(timeOption('4:00 PM')).toHaveAttribute('aria-checked', 'true');
    expect(timeOption('11:00 AM')).toHaveAttribute('aria-checked', 'false');
  });

  it('hides today once all of its slots have passed', async () => {
    jest.useRealTimers();
    pinClock(new Date(2026, 8, 14, 19, 30));
    render(<TourRequestForm onSubmitLead={jest.fn()} loading={false} />);
    await screen.findByRole('radiogroup', { name: 'Preferred Visit Date' });

    expect(screen.queryByText('Today')).not.toBeInTheDocument();
    expect(screen.getAllByRole('radio', { name: /2026$/ })).toHaveLength(14);
    expect(dateOption(2026, 8, 15)).toHaveAttribute('aria-checked', 'true');
  });

  it('moves the date selection with the arrow keys', async () => {
    render(<TourRequestForm onSubmitLead={jest.fn()} loading={false} />);
    await screen.findByRole('radiogroup', { name: 'Preferred Visit Date' });

    fireEvent.keyDown(dateOption(2026, 8, 15), { key: 'ArrowRight' });

    expect(dateOption(2026, 8, 16)).toHaveAttribute('aria-checked', 'true');
    expect(dateOption(2026, 8, 16)).toHaveFocus();
  });

  it('marks slots declined for the verified phone and moves the selection off them', async () => {
    const declined = [toLocalSlot('2026-09-15', '11:00').toISOString(), toLocalSlot('2026-09-15', '12:00').toISOString()];
    render(<TourRequestForm onSubmitLead={jest.fn()} loading={false} verifiedPhone="9876543210" declinedSlots={declined} />);
    await fillTourForm();

    const declinedOption = screen.getByRole('radio', { name: '11:00 AM, declined by the property manager' });
    expect(declinedOption).toBeDisabled();
    expect(screen.getByRole('radio', { name: '12:00 PM, declined by the property manager' })).toBeDisabled();
    expect(timeOption('9:00 AM')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText(/turned down by the property manager/i)).toBeInTheDocument();

    // Declined slots are for that date only
    fireEvent.click(dateOption(2026, 8, 16));
    expect(timeOption('11:00 AM')).toBeEnabled();
  });

  it('ignores declined slots when a different phone number is entered', async () => {
    const declined = [toLocalSlot('2026-09-15', '11:00').toISOString()];
    render(<TourRequestForm onSubmitLead={jest.fn()} loading={false} verifiedPhone="9876543210" declinedSlots={declined} />);
    await fillTourForm({ phone: '9123456789' });

    expect(timeOption('11:00 AM')).toBeEnabled();
    expect(timeOption('11:00 AM')).toHaveAttribute('aria-checked', 'true');
  });
});

describe('TourRequestForm', () => {
  it('skips the OTP wording for an already verified phone', () => {
    render(<TourRequestForm onSubmitLead={jest.fn()} loading={false} verifiedPhone="9876543210" />);
    fireEvent.change(screen.getByLabelText(/Mobile Number/i), { target: { value: '9876543210' } });

    expect(screen.getByRole('button', { name: /Submit Tour Request/i })).toBeInTheDocument();
    expect(screen.getByText(/Phone verified/i)).toBeInTheDocument();
  });
});

describe('RoomConversionContainer tour request flow', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // The verified session is remembered per tab; start every test unverified
    window.sessionStorage.clear();
    mockedApi.getDeclinedTourSlots.mockResolvedValue({ success: true, data: [] });
    mockedApi.requestOtp.mockResolvedValue({ success: true, data: { success: true, message: 'sent', resendAfterSeconds: 60 } });
    mockedApi.verifyOtp.mockResolvedValue({ success: true, data: { otpSessionToken: 'server-session-token' } });
  });

  async function verifyWithOtp() {
    await fillTourForm();
    fireEvent.click(screen.getByRole('button', { name: /Continue to OTP Verification/i }));
    expect(await screen.findByText(/Verify Mobile Number/i)).toBeInTheDocument();
    expect(screen.getByText(/Resend in 60s/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify Code & Proceed/i }));
  }

  it('creates the lead with the session token returned by OTP verification', async () => {
    mockedApi.createLead.mockResolvedValue({
      success: true,
      data: {
        id: 'lead-1',
        propertyId: 'prop-1',
        unitId: 'unit-1',
        leadType: 'TOUR_REQUEST',
        status: 'NEW',
        preferredSlot: toLocalSlot('2099-01-15', '11:00').toISOString(),
        createdAt: new Date().toISOString(),
      },
    });

    render(<RoomConversionContainer property={property} unit={unit} />);
    await verifyWithOtp();

    expect(await screen.findByText(/Awaiting landlord approval/i)).toBeInTheDocument();
    expect(screen.getByText(/Requested Visit/i)).toBeInTheDocument();
    expect(screen.getByText('Pending approval')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Track this request/i })).toHaveAttribute('href', '/market-place/my-requests');
    expect(mockedApi.verifyOtp).toHaveBeenCalledWith('9876543210', '000000');
    expect(mockedApi.createLead).toHaveBeenCalledWith(
      'prop-1',
      'unit-1',
      expect.objectContaining({ leadType: 'TOUR_REQUEST', prospectPhone: '9876543210' }),
      'server-session-token'
    );
  });

  it('shows the server error and retries with the same verified session without a new OTP', async () => {
    mockedApi.createLead
      .mockRejectedValueOnce(new Error('Unit does not belong to specified property'))
      .mockResolvedValueOnce({
        success: true,
        data: { id: 'lead-2', propertyId: 'prop-1', unitId: 'unit-1', leadType: 'TOUR_REQUEST', status: 'NEW', createdAt: new Date().toISOString() },
      });

    render(<RoomConversionContainer property={property} unit={unit} />);
    await verifyWithOtp();

    expect(await screen.findByRole('alert')).toHaveTextContent('Unit does not belong to specified property');

    // The form stays editable and submits directly with the existing session
    const submit = await screen.findByRole('button', { name: /Submit Tour Request/i });
    expect(screen.getByLabelText(/Full Name/i)).not.toBeDisabled();
    fireEvent.click(submit);

    expect(await screen.findByText(/Awaiting landlord approval/i)).toBeInTheDocument();
    expect(mockedApi.requestOtp).toHaveBeenCalledTimes(1);
    expect(mockedApi.createLead).toHaveBeenLastCalledWith('prop-1', 'unit-1', expect.anything(), 'server-session-token');
  });

  it('shows OTP request errors under the form', async () => {
    mockedApi.requestOtp.mockRejectedValue(new Error('Please wait before requesting another OTP code'));

    render(<RoomConversionContainer property={property} unit={unit} />);
    await fillTourForm();
    fireEvent.click(screen.getByRole('button', { name: /Continue to OTP Verification/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Please wait before requesting another OTP code');
    expect(screen.queryByText(/Verify Mobile Number/i)).not.toBeInTheDocument();
  });

  it('reuses a phone verified earlier in this tab without asking for a new OTP', async () => {
    saveOtpSession('stored-session-token', '9876543210');
    mockedApi.createLead.mockResolvedValue({
      success: true,
      data: { id: 'lead-3', propertyId: 'prop-1', unitId: 'unit-1', leadType: 'TOUR_REQUEST', status: 'NEW', createdAt: new Date().toISOString() },
    });

    render(<RoomConversionContainer property={property} unit={unit} />);
    await fillTourForm();
    fireEvent.click(await screen.findByRole('button', { name: /Submit Tour Request/i }));

    expect(await screen.findByText(/Awaiting landlord approval/i)).toBeInTheDocument();
    expect(mockedApi.requestOtp).not.toHaveBeenCalled();
    expect(mockedApi.createLead).toHaveBeenCalledWith('prop-1', 'unit-1', expect.anything(), 'stored-session-token');
  });

  it('shows the existing request instead of an error when the phone already has an active tour here', async () => {
    saveOtpSession('stored-session-token', '9876543210');
    mockedApi.createLead.mockRejectedValue(
      new ApiError('You already have an active tour request for this property', 'CONFLICT', undefined, 409, {
        existingRequest: { leadId: 'lead-old', unitId: 'unit-1', unitNumber: '101', status: 'APPROVED', preferredSlot: '2099-01-15T05:30:00Z' },
      })
    );

    render(<RoomConversionContainer property={property} unit={unit} />);
    await fillTourForm();
    fireEvent.click(await screen.findByRole('button', { name: /Submit Tour Request/i }));

    expect(await screen.findByText(/You already have a visit request at this property/i)).toBeInTheDocument();
    expect(screen.getByText(/Unit 101/)).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View my requests/i })).toHaveAttribute('href', '/market-place/my-requests');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Change details/i }));
    expect(screen.queryByText(/You already have a visit request at this property/i)).not.toBeInTheDocument();
  });

  it('loads the slots declined for the verified phone and disables them', async () => {
    saveOtpSession('stored-session-token', '9876543210');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const declinedSlot = toLocalSlot(toLocalIsoDate(tomorrow), '11:00').toISOString();
    mockedApi.getDeclinedTourSlots.mockResolvedValue({ success: true, data: [declinedSlot] });

    render(<RoomConversionContainer property={property} unit={unit} />);
    await fillTourForm();

    expect(await screen.findByRole('radio', { name: '11:00 AM, declined by the property manager' })).toBeDisabled();
    expect(mockedApi.getDeclinedTourSlots).toHaveBeenCalledWith('stored-session-token', 'prop-1');
    await waitFor(() => expect(screen.getByRole('radio', { name: '9:00 AM' })).toHaveAttribute('aria-checked', 'true'));
  });

  it('explains a refused declined slot and blocks it without showing the duplicate notice', async () => {
    saveOtpSession('stored-session-token', '9876543210');
    mockedApi.createLead.mockImplementation(async (_p, _u, req) => {
      throw new ApiError('The property manager declined a visit at this time. Please pick another date or time.', 'TOUR_SLOT_DECLINED', undefined, 409, {
        code: 'TOUR_SLOT_DECLINED',
        slot: req.preferredSlot,
      });
    });

    render(<RoomConversionContainer property={property} unit={unit} />);
    await fillTourForm();
    fireEvent.click(await screen.findByRole('button', { name: /Submit Tour Request/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/declined a visit at this time/i);
    expect(await screen.findByRole('radio', { name: '11:00 AM, declined by the property manager' })).toBeDisabled();
    expect(screen.queryByText(/You already have a visit request at this property/i)).not.toBeInTheDocument();
  });

  it('forgets an expired session so the next submit verifies the phone again', async () => {
    saveOtpSession('expired-token', '9876543210');
    mockedApi.createLead.mockRejectedValue(new Error('OTP session has expired. Please verify again.'));

    render(<RoomConversionContainer property={property} unit={unit} />);
    await fillTourForm();
    fireEvent.click(await screen.findByRole('button', { name: /Submit Tour Request/i }));

    expect(await screen.findByRole('button', { name: /Continue to OTP Verification/i })).toBeInTheDocument();
    expect(window.sessionStorage.length).toBe(0);
  });
});

describe('parseErrorBody', () => {
  it('reads the backend error message', () => {
    expect(parseErrorBody({ status: 400, error: 'Bad Request', message: 'Invalid OTP code. Please check and try again.' })).toEqual({
      code: undefined,
      message: 'Invalid OTP code. Please check and try again.',
    });
  });

  it('prefers the first field validation message', () => {
    expect(
      parseErrorBody({ error: 'Bad Request', message: 'Validation failed', fieldErrors: [{ field: 'phone', message: 'Phone must be a valid 10-digit number' }] })
        .message
    ).toBe('Phone must be a valid 10-digit number');
  });

  it('supports nested error objects', () => {
    expect(parseErrorBody({ error: { code: 'OTP_EXPIRED', message: 'OTP expired' } })).toEqual({ code: 'OTP_EXPIRED', message: 'OTP expired' });
  });
});
