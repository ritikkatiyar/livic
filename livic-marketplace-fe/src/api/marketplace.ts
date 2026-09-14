import { apiRequest } from './client';
import {
  mockCreateLead,
  mockGetLeadStatus,
  mockInitiateTokenPayment,
  mockRequestOtp,
  mockVerifyOtp,
} from './mock/leads.mock';
import {
  mockGetPropertyDetail,
  mockGetPropertyUnits,
  mockGetUnitDetail,
  mockSearchProperties,
} from './mock/properties.mock';
import { toPropertyDetail, toPropertySummaries, toRazorpayOrder, toUnitDetail, toUnitPage } from './adapters';
import { ApiResponse, PagedResult } from '@/types/api';
import { CreateLeadRequest, LeadResponse, RazorpayOrderPayload } from '@/types/lead';
import { PropertyDetail, PropertySearchFilters, PropertySummary } from '@/types/property';
import { UnitSummary } from '@/types/unit';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false';

export async function searchProperties(
  filters: PropertySearchFilters
): Promise<ApiResponse<PropertySummary[]>> {
  if (USE_MOCK) {
    const data = await mockSearchProperties(filters);
    return { success: true, data };
  }

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
  if (USE_MOCK) {
    const data = await mockGetPropertyDetail(propertyId);
    return { success: true, data };
  }

  const res = await apiRequest<Parameters<typeof toPropertyDetail>[0]>(`/marketplace/properties/${propertyId}`);
  return { ...res, data: toPropertyDetail(res.data) };
}

export const ROOMS_PAGE_SIZE = 10;

export async function getPropertyUnits(
  propertyId: string,
  { page, availableOnly }: { page: number; availableOnly: boolean }
): Promise<ApiResponse<PagedResult<UnitSummary>>> {
  if (USE_MOCK) {
    const data = await mockGetPropertyUnits(propertyId, { page, pageSize: ROOMS_PAGE_SIZE, availableOnly });
    return { success: true, data };
  }

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
  if (USE_MOCK) {
    const data = await mockGetUnitDetail(propertyId, unitId);
    return { success: true, data };
  }

  const res = await apiRequest<Parameters<typeof toUnitDetail>[0]>(
    `/marketplace/properties/${propertyId}/units/${unitId}`
  );
  return { ...res, data: toUnitDetail(res.data) };
}

export type OtpRequestResult = { success: boolean; message: string; resendAfterSeconds?: number };

export async function requestOtp(phone: string): Promise<ApiResponse<OtpRequestResult>> {
  if (USE_MOCK) {
    const data = await mockRequestOtp(phone);
    return { success: true, data };
  }

  return apiRequest<OtpRequestResult>('/marketplace/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<ApiResponse<{ otpSessionToken: string }>> {
  if (USE_MOCK) {
    const data = await mockVerifyOtp(phone, code);
    return { success: true, data };
  }

  const res = await apiRequest<{ sessionToken: string }>('/marketplace/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
  return { ...res, data: res.data ? { otpSessionToken: res.data.sessionToken } : null };
}

export async function createLead(
  propertyId: string,
  unitId: string,
  request: CreateLeadRequest,
  otpSessionToken: string
): Promise<ApiResponse<LeadResponse>> {
  if (USE_MOCK) {
    const data = await mockCreateLead(propertyId, unitId, request, otpSessionToken);
    return { success: true, data };
  }

  return apiRequest<LeadResponse>(`/marketplace/properties/${propertyId}/units/${unitId}/leads`, {
    method: 'POST',
    body: JSON.stringify(request),
    otpSessionToken,
  });
}

export async function initiateTokenPayment(
  leadId: string
): Promise<ApiResponse<RazorpayOrderPayload>> {
  if (USE_MOCK) {
    const data = await mockInitiateTokenPayment(leadId);
    return { success: true, data };
  }

  const res = await apiRequest<Parameters<typeof toRazorpayOrder>[0]>(`/marketplace/leads/${leadId}/token-payment/online`, {
    method: 'POST',
  });
  return { ...res, data: res.data ? toRazorpayOrder(res.data) : null };
}

export async function getLeadStatus(leadId: string): Promise<ApiResponse<LeadResponse>> {
  if (USE_MOCK) {
    const data = await mockGetLeadStatus(leadId);
    return { success: true, data };
  }

  return apiRequest<LeadResponse>(`/marketplace/leads/${leadId}`);
}
