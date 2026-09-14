import { CreateLeadRequest, LeadResponse, RazorpayOrderPayload } from '@/types/lead';

const MOCK_LEADS_DB: Record<string, LeadResponse> = {};

export async function mockRequestOtp(phone: string): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  if (!phone || phone.length < 10) {
    throw new Error('Please enter a valid 10-digit mobile number');
  }
  return {
    success: true,
    message: `OTP sent successfully to +91 ${phone}. Use 000000 for mock verification.`,
  };
}

export async function mockVerifyOtp(
  phone: string,
  code: string
): Promise<{ otpSessionToken: string }> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  if (code !== '000000' && code.length !== 6) {
    throw new Error('Invalid OTP code. Please use code 000000 for mock testing.');
  }

  const token = `mock-otp-token-${phone}-${Date.now()}`;
  return { otpSessionToken: token };
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

  const leadId = `lead-${Math.random().toString(36).substring(2, 9)}`;
  const tokenAmount = req.leadType === 'BOOKING' ? req.tokenAmount || 2000 : undefined;

  const leadResponse: LeadResponse = {
    id: leadId,
    propertyId,
    unitId,
    leadType: req.leadType,
    status: req.leadType === 'TOUR_REQUEST' ? 'CONFIRMED' : 'NEW',
    tokenAmount,
    createdAt: new Date().toISOString(),
  };

  MOCK_LEADS_DB[leadId] = leadResponse;
  return leadResponse;
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
