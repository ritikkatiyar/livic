import { apiRequest } from '@/src/api/client';
import type { ApiInput, ApiModel } from '@/src/api/models';

export type CreateBookingRequest = ApiInput<'CreateBookingRequest'>;

export type UnitBookingResponse = ApiModel<'UnitBookingResponse', never, 'prospectiveTenantUserId' | 'prospectiveTenantEmail' | 'paymentTransactionId' | 'convertedLeaseId'>;

export type VacatingUnitResponse = ApiModel<'UnitResponse'>;

export async function createUnitBooking(payload: CreateBookingRequest, token: string): Promise<UnitBookingResponse> {
  return await apiRequest<UnitBookingResponse>('/api/v1/finance/unit-bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export async function listUnitBookings(token: string): Promise<UnitBookingResponse[]> {
  return await apiRequest<UnitBookingResponse[]>('/api/v1/finance/unit-bookings', {
    method: 'GET',
    token,
  }).catch((err) => {
    console.warn('[Booking API] Failed to list unit bookings:', err.message);
    return [];
  });
}

export async function forfeitUnitBooking(bookingId: string, token: string): Promise<UnitBookingResponse> {
  return await apiRequest<UnitBookingResponse>(`/api/v1/finance/unit-bookings/${bookingId}/forfeit`, {
    method: 'POST',
    token,
  });
}

export async function refundUnitBooking(bookingId: string, token: string): Promise<UnitBookingResponse> {
  return await apiRequest<UnitBookingResponse>(`/api/v1/finance/unit-bookings/${bookingId}/refund`, {
    method: 'POST',
    token,
  });
}

export async function initiateTokenOnlinePayment(bookingId: string, token: string): Promise<any> {
  return await apiRequest<any>(`/api/v1/finance/unit-bookings/${bookingId}/token-payment/online`, {
    method: 'POST',
    token,
  });
}

export async function recordTokenCashPayment(bookingId: string, amount: number, note: string, token: string): Promise<any> {
  return await apiRequest<any>(`/api/v1/finance/unit-bookings/${bookingId}/token-payment/cash`, {
    method: 'POST',
    body: JSON.stringify({ amount, note }),
    token,
  });
}

export async function getVacatingUnits(propertyId: string, token: string): Promise<any[]> {
  return await apiRequest<any[]>(`/api/v1/properties/${propertyId}/units/vacating`, {
    method: 'GET',
    token,
  }).catch((err) => {
    console.warn('[Booking API] Failed to fetch vacating units:', err.message);
    return [];
  });
}

export async function serveLeaseNotice(leaseId: string, moveOutDate: string, token: string): Promise<any> {
  return await apiRequest<any>(`/api/v1/finance/leases/${leaseId}/notice`, {
    method: 'PUT',
    body: JSON.stringify({ moveOutDate }),
    token,
  });
}
