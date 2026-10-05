import type { ApiInput, ApiModel } from '@/api/models';

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

/** Error code of the 409 returned when a phone re-requests a visit slot the landlord already declined. */
export const TOUR_SLOT_DECLINED_CODE = 'TOUR_SLOT_DECLINED';
/** Prefix of every 409 code meaning the chosen visit time can't be booked (declined, full, or not offered). */
export const TOUR_SLOT_ERROR_PREFIX = 'TOUR_SLOT_';

/**
 * Generated from the backend's OpenAPI spec. preferredSlot (ISO datetime) is only for TOUR_REQUEST,
 * expectedMoveInDate (ISO date) and tokenAmount only for BOOKING; whatsappOptIn records the
 * prospect's consent, which Meta requires before messaging.
 */
export type CreateLeadRequest = ApiInput<'CreateLeadRequest'>;

/** What both creating a lead and reading its status return. */
export type LeadResponse = ApiModel<
  'LeadStatusResponse',
  'preferredSlot' | 'tokenAmount' | 'paymentTransactionId' | 'convertedUnitBookingId',
  'preferredSlot'
>;

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
