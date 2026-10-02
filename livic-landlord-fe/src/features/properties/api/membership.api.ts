import { apiRequest } from '@/src/api/client';
import type { ApiInput, ApiModel } from '@/src/api/models';

export type MembershipResponse = ApiModel<'MembershipResponse', 'permissionCodes'>;

export type UpdateMembershipRequest = ApiInput<'UpdateMembershipRequest'>;

export type TransferOwnershipRequest = ApiInput<'TransferOwnershipRequest'>;

export interface MembershipPageResponse {
  content: MembershipResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export async function getMemberships(token: string, propertyId: string, page = 0, size = 50): Promise<MembershipResponse[]> {
  const response = await apiRequest<MembershipPageResponse | MembershipResponse[]>(
    `/api/v1/properties/${propertyId}/memberships?page=${page}&size=${size}`,
    {
      method: 'GET',
      token,
    }
  );
  if (Array.isArray(response)) {
    return response;
  }
  return response?.content || [];
}

export function getMembershipsPage(token: string, propertyId: string, page = 0, size = 20): Promise<MembershipPageResponse> {
  return apiRequest<MembershipPageResponse>(
    `/api/v1/properties/${propertyId}/memberships?page=${page}&size=${size}`,
    {
      method: 'GET',
      token,
    }
  );
}

export function updateMembership(token: string, propertyId: string, membershipId: string, data: UpdateMembershipRequest): Promise<MembershipResponse> {
  return apiRequest<MembershipResponse>(`/api/v1/properties/${propertyId}/memberships/${membershipId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  });
}

export function toggleMembershipActive(token: string, propertyId: string, membershipId: string, active: boolean): Promise<void> {
  return apiRequest<void>(`/api/v1/properties/${propertyId}/memberships/${membershipId}/toggle-active?active=${active}`, {
    method: 'PATCH',
    token,
  });
}

export function removeMembership(token: string, propertyId: string, membershipId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/properties/${propertyId}/memberships/${membershipId}`, {
    method: 'DELETE',
    token,
  });
}

export function transferOwnership(token: string, propertyId: string, data: TransferOwnershipRequest): Promise<void> {
  return apiRequest<void>(`/api/v1/properties/${propertyId}/memberships/transfer-ownership`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}
