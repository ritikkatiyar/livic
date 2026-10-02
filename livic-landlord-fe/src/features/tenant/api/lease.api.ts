import { apiRequest } from '@/src/api/client';
import type { ApiInput, ApiModel } from '@/src/api/models';

export type CreateLeaseRequest = ApiInput<'CreateLeaseRequest'>;

export type LeaseResponse = ApiModel<'LeaseResponse', 'blockId' | 'blockName' | 'moveOutDate' | 'tenantName' | 'tenantPhone' | 'propertyName', 'blockId' | 'blockName' | 'moveOutDate'>;

export function createLease(payload: CreateLeaseRequest, token: string): Promise<LeaseResponse> {
  return apiRequest<LeaseResponse>('/api/v1/finance/leases', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function terminateLease(leaseId: string, token: string): Promise<LeaseResponse> {
  return apiRequest<LeaseResponse>(`/api/v1/finance/leases/${leaseId}/terminate`, {
    method: 'PUT',
    token,
  });
}

export function getActiveLease(token: string): Promise<LeaseResponse | null> {
  return apiRequest<LeaseResponse | null>('/api/v1/finance/leases/tenant/active', {
    method: 'GET',
    token,
  });
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export function listActiveLeasesByProperty(
  propertyId: string | null | undefined,
  token: string,
  page: number = 0,
  size: number = 20,
  blockId?: string | null
): Promise<PageResponse<LeaseResponse>> {
  const params = new URLSearchParams();
  if (propertyId) params.append('propertyId', propertyId);
  if (blockId) params.append('blockId', blockId);
  params.append('page', String(page));
  params.append('size', String(size));
  return apiRequest<PageResponse<LeaseResponse>>(`/api/v1/finance/leases?${params.toString()}`, {
    method: 'GET',
    token,
  });
}

export function updateLeaseTerms(
  leaseId: string,
  payload: { monthlyRentAmount: number; securityDeposit: number },
  token: string
): Promise<LeaseResponse> {
  return apiRequest<LeaseResponse>(`/api/v1/finance/leases/${leaseId}/terms`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
}
