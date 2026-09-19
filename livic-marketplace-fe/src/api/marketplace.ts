import { apiRequest } from './client';
import {
  toMyTourRequestPage,
  toPropertyDetail,
  toPropertySummaries,
  toRazorpayOrder,
  toUnitDetail,
  toUnitPage,
} from './adapters';
import { ApiResponse, PagedResult } from '@/types/api';
import { CreateLeadRequest, LeadResponse, MyTourRequest, RazorpayOrderPayload } from '@/types/lead';
import { PropertyDetail, PropertySearchFilters, PropertySummary } from '@/types/property';
import { TourSlots } from '@/types/tourSlot';
import { UnitSummary } from '@/types/unit';

export async function searchProperties(
  filters: PropertySearchFilters
): Promise<ApiResponse<PropertySummary[]>> {
  const queryParams = new URLSearchParams();
  if (filters.city) queryParams.set('city', filters.city);
  if (filters.minPrice !== undefined) queryParams.set('minPrice', filters.minPrice.toString());
  if (filters.maxPrice !== undefined) queryParams.set('maxPrice', filters.maxPrice.toString());
  // The backend filters by a single property type
  if (filters.propertyType && filters.propertyType.length === 1) {
    queryParams.set('type', filters.propertyType[0]);
  }
  if (filters.availableFrom) queryParams.set('availableFrom', filters.availableFrom);

  const res = await apiRequest<Parameters<typeof toPropertySummaries>[0]>(`/marketplace/properties?${queryParams.toString()}`);
  return { ...res, data: toPropertySummaries(res.data) };
}

export async function getPropertyDetail(
  propertyId: string
): Promise<ApiResponse<PropertyDetail | null>> {
  const res = await apiRequest<Parameters<typeof toPropertyDetail>[0]>(`/marketplace/properties/${propertyId}`);
  return { ...res, data: toPropertyDetail(res.data) };
}

export const ROOMS_PAGE_SIZE = 10;

export async function getPropertyUnits(
  propertyId: string,
  { page, availableOnly }: { page: number; availableOnly: boolean }
): Promise<ApiResponse<PagedResult<UnitSummary>>> {
  const queryParams = new URLSearchParams({
    page: String(page - 1), // backend pages are 0-based
    size: String(ROOMS_PAGE_SIZE),
    availableOnly: String(availableOnly),
  });

  const res = await apiRequest<Parameters<typeof toUnitPage>[0]>(
    `/marketplace/properties/${propertyId}/units?${queryParams.toString()}`
  );
  return { ...res, data: toUnitPage(res.data) };
}

export async function getUnitDetail(
  propertyId: string,
  unitId: string
): Promise<ApiResponse<{ property: PropertyDetail; unit: UnitSummary } | null>> {
  const res = await apiRequest<Parameters<typeof toUnitDetail>[0]>(
    `/marketplace/properties/${propertyId}/units/${unitId}`
  );
  return { ...res, data: toUnitDetail(res.data) };
}

export type OtpRequestResult = { expiresSeconds?: number; resendAfterSeconds?: number };

export async function requestOtp(phone: string): Promise<ApiResponse<OtpRequestResult>> {
  return apiRequest<OtpRequestResult>('/marketplace/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export type OtpVerifyResult = { otpSessionToken: string; expiresAt?: string | null };

export async function verifyOtp(
  phone: string,
  code: string
): Promise<ApiResponse<OtpVerifyResult>> {
  const res = await apiRequest<{ sessionToken: string; expiresAt?: string }>('/marketplace/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
  return {
    ...res,
    data: res.data ? { otpSessionToken: res.data.sessionToken, expiresAt: res.data.expiresAt ?? null } : null,
  };
}

export const MY_REQUESTS_PAGE_SIZE = 10;

/** Tour requests for the phone behind the OTP session, newest first. `page` is 1-based. */
export async function getMyTourRequests(
  otpSessionToken: string,
  page: number
): Promise<ApiResponse<PagedResult<MyTourRequest>>> {
  const queryParams = new URLSearchParams({ page: String(page - 1), size: String(MY_REQUESTS_PAGE_SIZE) });
  const res = await apiRequest<Parameters<typeof toMyTourRequestPage>[0]>(
    `/marketplace/my/tour-requests?${queryParams.toString()}`,
    { otpSessionToken }
  );
  return { ...res, data: toMyTourRequestPage(res.data) };
}

export async function cancelMyTourRequest(
  otpSessionToken: string,
  leadId: string
): Promise<ApiResponse<MyTourRequest>> {
  const res = await apiRequest<MyTourRequest>(`/marketplace/my/tour-requests/${leadId}/cancel`, {
    method: 'POST',
    otpSessionToken,
  });
  return res.data ? { ...res, data: toMyTourRequestPage({ content: [res.data], number: 0, size: 1, totalElements: 1, totalPages: 1 }).items[0] } : res;
}

/**
 * The visit slots this property currently offers, generated from the landlord's visiting hours.
 * With a verified phone session, slots the landlord declined for that phone are marked.
 */
export async function getTourSlots(propertyId: string, otpSessionToken?: string | null): Promise<ApiResponse<TourSlots>> {
  return apiRequest<TourSlots>(`/marketplace/properties/${propertyId}/tour-slots`, {
    otpSessionToken: otpSessionToken ?? undefined,
  });
}

export async function createLead(
  propertyId: string,
  unitId: string,
  request: CreateLeadRequest,
  otpSessionToken: string
): Promise<ApiResponse<LeadResponse>> {
  return apiRequest<LeadResponse>(`/marketplace/properties/${propertyId}/units/${unitId}/leads`, {
    method: 'POST',
    body: JSON.stringify(request),
    otpSessionToken,
  });
}

export async function initiateTokenPayment(
  leadId: string
): Promise<ApiResponse<RazorpayOrderPayload>> {
  const res = await apiRequest<Parameters<typeof toRazorpayOrder>[0]>(`/marketplace/leads/${leadId}/token-payment/online`, {
    method: 'POST',
  });
  return { ...res, data: res.data ? toRazorpayOrder(res.data) : null };
}

export async function getLeadStatus(leadId: string): Promise<ApiResponse<LeadResponse>> {
  return apiRequest<LeadResponse>(`/marketplace/leads/${leadId}`);
}
