import { apiRequest } from '@/src/api/client';
import type { ApiInput, ApiModel } from '@/src/api/models';

export type CreateLeaseRequest = ApiInput<'CreateLeaseRequest'>;

export type LeaseResponse = ApiModel<'LeaseResponse', 'moveOutDate' | 'tenantName' | 'tenantPhone' | 'propertyName', 'moveOutDate'>;

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

export async function listActiveLeasesByProperty(propertyId: string, token: string, size = 1000): Promise<LeaseResponse[]> {
  try {
    const res = await apiRequest<PageResponse<LeaseResponse> | LeaseResponse[]>(`/api/v1/finance/leases?propertyId=${propertyId}&size=${size}`, {
      method: 'GET',
      token,
    });
    if (Array.isArray(res)) {
      return res;
    }
    return res?.content || [];
  } catch (err: any) {
    console.warn('[Lease API] Failed to list active leases:', err?.message);
    return [];
  }
}

