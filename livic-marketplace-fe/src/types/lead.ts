export type LeadType = 'TOUR_REQUEST' | 'BOOKING';

/**
 * Backend lead status. For tour requests `NEW` means "pending the landlord's approval";
 * APPROVED / REJECTED are landlord decisions, COMPLETED / EXPIRED are set once the visit time passes.
 */
export type LeadStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'CONVERTED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'EXPIRED';

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

/** The active tour request that blocks a new one at the same property (returned with a 409). */
export type ExistingTourRequest = {
  leadId: string;
  unitId: string;
  unitNumber: string | null;
  status: LeadStatus;
  preferredSlot: string;
};

/** A tour request as shown to the prospect on "My Requests". */
export type MyTourRequest = {
  id: string;
  propertyId: string;
  propertyName: string | null;
  propertyAddress: string | null;
  propertyCity: string | null;
  unitId: string;
  unitNumber: string | null;
  preferredSlot: string;
  status: LeadStatus;
  decisionNote: string | null;
  decidedAt: string | null;
  cancellable: boolean;
  createdAt: string;
};
