import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RoomConversionContainer } from '@/components/booking/RoomConversionContainer';
import { TourRequestForm } from '@/components/booking/TourRequestForm';
import { parseLocalIsoDate, toLocalIsoDate, toLocalSlot } from '@/utils/visitSlots';
import { TourSlots, TourSlotStatus } from '@/types/tourSlot';
import { ApiError, parseErrorBody } from '@/api/client';
import { saveOtpSession } from '@/features/leads/otpSessionStorage';
import * as api from '@/api/marketplace';
import { PropertyDetail } from '@/types/property';
import { UnitSummary } from '@/types/unit';

jest.mock('@/api/marketplace', () => ({
  requestOtp: jest.fn(),
  verifyOtp: jest.fn(),
  createLead: jest.fn(),
  getTourSlots: jest.fn(),
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
const dateOption = (date: string, suffix = '') =>
  screen.getByRole('radio', { name: `${fullDate.format(parseLocalIsoDate(date))}${suffix}` });
const timeOption = (label: string) => screen.getByRole('radio', { name: label });

/** `YYYY-MM-DD` a few days out, so fixtures never depend on the current date. */
function dateIn(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalIsoDate(d);
}

type SlotSpec = string | { time: string; status: TourSlotStatus };

/** Builds the slot payload the backend would return, with starts in the test machine's timezone. */
function slotsFixture(
  days: { date: string; closed?: boolean; slots?: SlotSpec[] }[],
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
): TourSlots {
  return {
    propertyId: 'prop-1',
    timezone,
    slotMinutes: 60,
    days: days.map((day) => ({
      date: day.date,
      closed: Boolean(day.closed),
      slots: (day.slots ?? []).map((spec) => {
        const { time, status } = typeof spec === 'string' ? { time: spec, status: 'AVAILABLE' as TourSlotStatus } : spec;
        return { start: toLocalSlot(day.date, time).toISOString(), localTime: time, status };
      }),
    })),
  };
}

const WORKING_DAY: SlotSpec[] = ['09:00', '10:00', '11:00', '15:00', '16:00', '17:00'];

async function fillTourForm({ phone = '9876543210' } = {}) {
  fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Test Visitor' } });
  fireEvent.change(screen.getByLabelText(/Mobile Number/i), { target: { value: phone } });
  await screen.findByRole('radiogroup', { name: 'Preferred Visit Date' });
}

describe('TourRequestForm date & time pickers', () => {
  const today = dateIn(0);
  const tomorrow = dateIn(1);
  const dayAfter = dateIn(2);

  it('shows a skeleton until the property slots arrive', () => {
    render(<TourRequestForm onSubmitLead={jest.fn()} loading={false} slots={null} isLoadingSlots />);

    expect(screen.queryByRole('radiogroup', { name: 'Preferred Visit Date' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue to OTP Verification/i })).toBeDisabled();
  });

  it('preselects the first bookable slot the property offers', async () => {
    const slots = slotsFixture([
      { date: today, slots: [{ time: '09:00', status: 'UNAVAILABLE' }, { time: '16:00', status: 'UNAVAILABLE' }] },
      { date: tomorrow, slots: WORKING_DAY },
    ]);
    render(<TourRequestForm onSubmitLead={jest.fn()} loading={false} slots={slots} isLoadingSlots={false} />);

    await waitFor(() => expect(dateOption(tomorrow)).toHaveAttribute('aria-checked', 'true'));
    expect(timeOption('9:00 AM')).toHaveAttribute('aria-checked', 'true');
  });

  it('submits the exact slot instant the backend generated', async () => {
    const onSubmitLead = jest.fn();
    const slots = slotsFixture([{ date: tomorrow, slots: WORKING_DAY }, { date: dayAfter, slots: WORKING_DAY }]);
    render(<TourRequestForm onSubmitLead={onSubmitLead} loading={false} slots={slots} isLoadingSlots={false} />);
    await fillTourForm();

    fireEvent.click(dateOption(dayAfter));
    fireEvent.click(timeOption('4:00 PM'));
    fireEvent.click(screen.getByRole('button', { name: /Continue to OTP Verification/i }));

    await waitFor(() => expect(onSubmitLead).toHaveBeenCalledTimes(1));
    expect(onSubmitLead.mock.calls[0][0]).toMatchObject({
      leadType: 'TOUR_REQUEST',
      prospectName: 'Test Visitor',
      prospectPhone: '9876543210',
      preferredSlot: toLocalSlot(dayAfter, '16:00').toISOString(),
    });
  });

  it('marks declined, full and unavailable slots and keeps them unselectable', async () => {
    const slots = slotsFixture([
      {
        date: tomorrow,
        slots: [
          { time: '09:00', status: 'UNAVAILABLE' },
          { time: '10:00', status: 'DECLINED' },
          { time: '11:00', status: 'FULL' },
          '15:00',
        ],
      },
    ]);
    render(<TourRequestForm onSubmitLead={jest.fn()} loading={false} slots={slots} isLoadingSlots={false} />);
    await fillTourForm();

    expect(screen.getByRole('radio', { name: '9:00 AM, not available' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: '10:00 AM, declined by the property manager' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: '11:00 AM, fully booked' })).toBeDisabled();
    // The only bookable slot is preselected
    await waitFor(() => expect(timeOption('3:00 PM')).toHaveAttribute('aria-checked', 'true'));
  });

  it('shows closed days as closed and skips them with the arrow keys', async () => {
    const slots = slotsFixture([
      { date: tomorrow, slots: WORKING_DAY },
      { date: dayAfter, closed: true },
      { date: dateIn(3), slots: WORKING_DAY },
    ]);
    render(<TourRequestForm onSubmitLead={jest.fn()} loading={false} slots={slots} isLoadingSlots={false} />);
    await fillTourForm();

    expect(dateOption(dayAfter, ', closed')).toBeDisabled();
    expect(screen.getByText('Closed')).toBeInTheDocument();

    fireEvent.keyDown(dateOption(tomorrow), { key: 'ArrowRight' });

    expect(dateOption(dateIn(3))).toHaveAttribute('aria-checked', 'true');
  });

  it('moves the selection when the property stops offering the chosen slot', async () => {
    const slots = slotsFixture([{ date: tomorrow, slots: WORKING_DAY }]);
    const { rerender } = render(<TourRequestForm onSubmitLead={jest.fn()} loading={false} slots={slots} isLoadingSlots={false} />);
    await waitFor(() => expect(timeOption('9:00 AM')).toHaveAttribute('aria-checked', 'true'));

    const reloaded = slotsFixture([
      { date: tomorrow, slots: [{ time: '09:00', status: 'FULL' }, '10:00', '11:00', '15:00', '16:00', '17:00'] },
    ]);
    rerender(<TourRequestForm onSubmitLead={jest.fn()} loading={false} slots={reloaded} isLoadingSlots={false} />);

    await waitFor(() => expect(timeOption('10:00 AM')).toHaveAttribute('aria-checked', 'true'));
    expect(screen.getByRole('radio', { name: '9:00 AM, fully booked' })).toBeDisabled();
  });

  it('explains the timezone only when it differs from the visitor"s', async () => {
    const sameZone = slotsFixture([{ date: tomorrow, slots: WORKING_DAY }]);
    const { rerender } = render(<TourRequestForm onSubmitLead={jest.fn()} loading={false} slots={sameZone} isLoadingSlots={false} />);
    await fillTourForm();
    expect(screen.queryByText(/property's local time/i)).not.toBeInTheDocument();

    const otherZone = slotsFixture([{ date: tomorrow, slots: WORKING_DAY }], 'America/New_York');
    rerender(<TourRequestForm onSubmitLead={jest.fn()} loading={false} slots={otherZone} isLoadingSlots={false} />);

    expect(await screen.findByText(/property's local time/i)).toHaveTextContent('America/New_York');
  });
});

describe('RoomConversionContainer tour request flow', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // The verified session is remembered per tab; start every test unverified
    window.sessionStorage.clear();
    mockedApi.getTourSlots.mockResolvedValue({ success: true, data: slotsFixture([{ date: dateIn(1), slots: WORKING_DAY }, { date: dateIn(2), slots: WORKING_DAY }]) });
    mockedApi.requestOtp.mockResolvedValue({ success: true, data: { expiresSeconds: 300, resendAfterSeconds: 60 } });
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

  it('asks the backend for the slots, marking those declined for the verified phone', async () => {
    saveOtpSession('stored-session-token', '9876543210');
    mockedApi.getTourSlots.mockResolvedValue({
      success: true,
      data: slotsFixture([{ date: dateIn(1), slots: [{ time: '09:00', status: 'DECLINED' }, '10:00'] }]),
    });

    render(<RoomConversionContainer property={property} unit={unit} />);
    await fillTourForm();

    expect(await screen.findByRole('radio', { name: '9:00 AM, declined by the property manager' })).toBeDisabled();
    expect(mockedApi.getTourSlots).toHaveBeenCalledWith('prop-1', 'stored-session-token');
    await waitFor(() => expect(screen.getByRole('radio', { name: '10:00 AM' })).toHaveAttribute('aria-checked', 'true'));
  });

  it('reloads the slots when the server refuses the chosen time', async () => {
    saveOtpSession('stored-session-token', '9876543210');
    mockedApi.getTourSlots
      .mockResolvedValueOnce({ success: true, data: slotsFixture([{ date: dateIn(1), slots: ['09:00', '10:00'] }]) })
      .mockResolvedValue({
        success: true,
        data: slotsFixture([{ date: dateIn(1), slots: [{ time: '09:00', status: 'FULL' }, '10:00'] }]),
      });
    mockedApi.createLead.mockRejectedValue(
      new ApiError('This visit time is fully booked. Please pick another time.', 'TOUR_SLOT_FULL', undefined, 409, { code: 'TOUR_SLOT_FULL' })
    );

    render(<RoomConversionContainer property={property} unit={unit} />);
    await fillTourForm();
    fireEvent.click(await screen.findByRole('button', { name: /Submit Tour Request/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/fully booked/i);
    expect(await screen.findByRole('radio', { name: '9:00 AM, fully booked' })).toBeDisabled();
    expect(screen.queryByText(/You already have a visit request at this property/i)).not.toBeInTheDocument();
    await waitFor(() => expect(mockedApi.getTourSlots).toHaveBeenCalledTimes(2));
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

