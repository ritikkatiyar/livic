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
  mockGetUnitDetail,
  mockSearchProperties,
} from './mock/properties.mock';
import { ApiResponse } from '@/types/api';
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
  if (filters.propertyType && filters.propertyType.length > 0) {
    queryParams.set('type', filters.propertyType.join(','));
  }
  if (filters.availableFrom) queryParams.set('availableFrom', filters.availableFrom);

  return apiRequest<PropertySummary[]>(`/marketplace/properties?${queryParams.toString()}`);
}

export async function getPropertyDetail(
  propertyId: string
): Promise<ApiResponse<PropertyDetail | null>> {
  if (USE_MOCK) {
    const data = await mockGetPropertyDetail(propertyId);
    return { success: true, data };
  }

  return apiRequest<PropertyDetail | null>(`/marketplace/properties/${propertyId}`);
}

export async function getUnitDetail(
  propertyId: string,
  unitId: string
): Promise<ApiResponse<{ property: PropertyDetail; unit: UnitSummary } | null>> {
  if (USE_MOCK) {
    const data = await mockGetUnitDetail(propertyId, unitId);
    return { success: true, data };
  }

  return apiRequest<{ property: PropertyDetail; unit: UnitSummary } | null>(
    `/marketplace/properties/${propertyId}/units/${unitId}`
  );
}

export async function requestOtp(phone: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
  if (USE_MOCK) {
    const data = await mockRequestOtp(phone);
    return { success: true, data };
  }

  return apiRequest<{ success: boolean; message: string }>('/marketplace/otp/request', {
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

  return apiRequest<{ otpSessionToken: string }>('/marketplace/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
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

  return apiRequest<RazorpayOrderPayload>(`/marketplace/leads/${leadId}/token-payment/online`, {
    method: 'POST',
  });
}

export async function getLeadStatus(leadId: string): Promise<ApiResponse<LeadResponse>> {
  if (USE_MOCK) {
    const data = await mockGetLeadStatus(leadId);
    return { success: true, data };
  }

  return apiRequest<LeadResponse>(`/marketplace/leads/${leadId}`);
}
