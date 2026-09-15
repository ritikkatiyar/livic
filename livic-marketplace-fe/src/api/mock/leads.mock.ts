import { ApiError } from '../client';
import { PagedResult } from '@/types/api';
import { CreateLeadRequest, LeadResponse, MyTourRequest, RazorpayOrderPayload, TOUR_SLOT_DECLINED_CODE } from '@/types/lead';
import { toSlotMinute } from '@/utils/visitSlots';
import { MOCK_PROPERTIES } from './properties.mock';

const MOCK_LEADS_DB: Record<string, LeadResponse> = {};
/** Tour requests by lead id, with the phone that made them (mirrors the backend's one-active-tour rule). */
const MOCK_TOURS_DB: Record<string, MyTourRequest & { phone: string }> = {};

const MOCK_TOKEN_PREFIX = 'mock-otp-token-';

function phoneFromMockToken(otpSessionToken: string): string {
  if (!otpSessionToken?.startsWith(MOCK_TOKEN_PREFIX)) {
    throw new ApiError('Invalid or expired OTP session token', 'HTTP_400', undefined, 400);
  }
  return otpSessionToken.slice(MOCK_TOKEN_PREFIX.length).split('-')[0];
}

function isActiveMockTour(tour: MyTourRequest, now = Date.now()): boolean {
  return (tour.status === 'NEW' || tour.status === 'APPROVED') && Date.parse(tour.preferredSlot) > now;
}

function findDeclinedMockSlots(phone: string, propertyId: string, now = Date.now()): string[] {
  return Object.values(MOCK_TOURS_DB)
    .filter((t) => t.phone === phone && t.propertyId === propertyId && t.status === 'REJECTED' && Date.parse(t.preferredSlot) > now)
    .map((t) => t.preferredSlot)
    .sort();
}

export async function mockGetDeclinedTourSlots(otpSessionToken: string, propertyId: string): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return findDeclinedMockSlots(phoneFromMockToken(otpSessionToken), propertyId);
}

export async function mockRequestOtp(
  phone: string
): Promise<{ success: boolean; message: string; resendAfterSeconds: number }> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  if (!phone || phone.length < 10) {
    throw new Error('Please enter a valid 10-digit mobile number');
  }
  return {
    success: true,
    message: `OTP sent successfully to +91 ${phone}. Use 000000 for mock verification.`,
    resendAfterSeconds: 60,
  };
}

export async function mockVerifyOtp(
  phone: string,
  code: string
): Promise<{ otpSessionToken: string; expiresAt: string }> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  if (code !== '000000' && code.length !== 6) {
    throw new Error('Invalid OTP code. Please use code 000000 for mock testing.');
  }

  const token = `${MOCK_TOKEN_PREFIX}${phone}-${Date.now()}`;
  return { otpSessionToken: token, expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() };
}

export async function mockCreateLead(
  propertyId: string,
  unitId: string,
  req: CreateLeadRequest,
  otpSessionToken: string
): Promise<LeadResponse> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  if (!otpSessionToken) {
    throw new Error('Unauthorized: Missing OTP session token');
  }

  const phone = req.prospectPhone;
  if (req.leadType === 'TOUR_REQUEST') {
    const active = Object.values(MOCK_TOURS_DB).find(
      (t) => t.phone === phone && t.propertyId === propertyId && isActiveMockTour(t)
    );
    if (active) {
      throw new ApiError('You already have an active tour request at this property', 'HTTP_409', undefined, 409, {
        existingRequest: {
          leadId: active.id,
          unitId: active.unitId,
          unitNumber: active.unitNumber,
          status: active.status,
          preferredSlot: active.preferredSlot,
        },
      });
    }
    const declined = req.preferredSlot && findDeclinedMockSlots(phone, propertyId).find((slot) => toSlotMinute(slot) === toSlotMinute(req.preferredSlot!));
    if (declined) {
      throw new ApiError(
        'The property manager declined a visit at this time. Please pick another date or time.',
        TOUR_SLOT_DECLINED_CODE,
        undefined,
        409,
        { code: TOUR_SLOT_DECLINED_CODE, slot: declined }
      );
    }
  }

  const leadId = `lead-${Math.random().toString(36).substring(2, 9)}`;
  const tokenAmount = req.leadType === 'BOOKING' ? req.tokenAmount || 2000 : undefined;
  const createdAt = new Date().toISOString();

  const leadResponse: LeadResponse = {
    id: leadId,
    propertyId,
    unitId,
    leadType: req.leadType,
    // Tour requests wait for the landlord, like the real backend
    status: 'NEW',
    preferredSlot: req.preferredSlot ?? null,
    tokenAmount,
    createdAt,
  };

  MOCK_LEADS_DB[leadId] = leadResponse;

  if (req.leadType === 'TOUR_REQUEST' && req.preferredSlot) {
    const property = MOCK_PROPERTIES.find((p) => p.id === propertyId);
    MOCK_TOURS_DB[leadId] = {
      id: leadId,
      phone,
      propertyId,
      propertyName: property?.name ?? null,
      propertyAddress: property?.address ?? null,
      propertyCity: property?.city ?? null,
      unitId,
      unitNumber: property?.units.find((u) => u.id === unitId)?.unitNumber ?? null,
      preferredSlot: req.preferredSlot,
      status: 'NEW',
      decisionNote: null,
      decidedAt: null,
      cancellable: true,
      createdAt,
    };
  }

  return leadResponse;
}

export async function mockGetMyTourRequests(
  otpSessionToken: string,
  page: number,
  pageSize: number
): Promise<PagedResult<MyTourRequest>> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const phone = phoneFromMockToken(otpSessionToken);
  const tours = Object.values(MOCK_TOURS_DB)
    .filter((t) => t.phone === phone)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map(({ phone: _phone, ...tour }) => ({ ...tour, cancellable: isActiveMockTour(tour) }));
  const start = (page - 1) * pageSize;
  return {
    items: tours.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems: tours.length,
    totalPages: Math.ceil(tours.length / pageSize),
  };
}

export async function mockCancelMyTourRequest(otpSessionToken: string, leadId: string): Promise<MyTourRequest> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const phone = phoneFromMockToken(otpSessionToken);
  const tour = MOCK_TOURS_DB[leadId];
  if (!tour || tour.phone !== phone) {
    throw new ApiError('Tour request not found', 'HTTP_404', undefined, 404);
  }
  if (!isActiveMockTour(tour)) {
    throw new ApiError(`This tour request can no longer be cancelled (current status: ${tour.status})`, 'HTTP_409', undefined, 409);
  }
  tour.status = 'CANCELLED';
  tour.cancellable = false;
  const { phone: _phone, ...rest } = tour;
  return { ...rest };
}

export async function mockInitiateTokenPayment(leadId: string): Promise<RazorpayOrderPayload> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const lead = MOCK_LEADS_DB[leadId];
  const amount = (lead?.tokenAmount || 2000) * 100; // convert to paise

  return {
    orderId: `order_mock_${Math.random().toString(36).substring(2, 9)}`,
    amount,
    currency: 'INR',
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkey12345',
  };
}

export async function mockGetLeadStatus(leadId: string): Promise<LeadResponse> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const lead = MOCK_LEADS_DB[leadId];
  if (!lead) {
    return {
      id: leadId,
      propertyId: 'prop-101',
      unitId: 'unit-201',
      leadType: 'BOOKING',
      status: 'CONFIRMED',
      tokenAmount: 2000,
      paymentTransactionId: `pay_mock_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
  }

  // Auto-confirm booking lead on second poll check
  if (lead.leadType === 'BOOKING' && lead.status === 'NEW') {
    lead.status = 'CONFIRMED';
    lead.paymentTransactionId = `pay_mock_${Math.random().toString(36).substring(2, 9)}`;
  }

  return JSON.parse(JSON.stringify(lead));
}
