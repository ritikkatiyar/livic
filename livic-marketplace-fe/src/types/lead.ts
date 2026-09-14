export type LeadType = 'TOUR_REQUEST' | 'BOOKING';
export type LeadStatus = 'NEW' | 'CONFIRMED' | 'CONVERTED' | 'CANCELLED' | 'REFUNDED';

export type CreateLeadRequest = {
  leadType: LeadType;
  prospectName: string;
  prospectPhone: string;
  prospectEmail?: string;
  preferredSlot?: string; // ISO datetime, only for TOUR_REQUEST
  expectedMoveInDate?: string; // ISO date, only for BOOKING
  tokenAmount?: number; // token amount for booking
};

export type LeadResponse = {
  id: string;
  propertyId: string;
  unitId: string;
  leadType: LeadType;
  status: LeadStatus;
  preferredSlot?: string | null; // ISO datetime, only for TOUR_REQUEST
  tokenAmount?: number;
  paymentTransactionId?: string;
  createdAt: string;
};

export type RazorpayOrderPayload = {
  orderId: string;
  amount: number; // in paise (e.g. 200000 for ₹2000)
  currency: string;
  keyId: string;
};
