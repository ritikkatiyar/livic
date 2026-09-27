import { apiRequest } from '@/src/api/client';

export interface UserSearchResponse {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  globalRole: string;
}

/**
 * Looks up the account behind a full phone number. Partial numbers match nothing, and the caller
 * must be able to create leases on the property.
 */
export function searchUserByPhone(phone: string, propertyId: string, token: string): Promise<UserSearchResponse[]> {
  return apiRequest<UserSearchResponse[]>(
    `/api/v1/user/search?phone=${encodeURIComponent(phone)}&propertyId=${encodeURIComponent(propertyId)}`,
    {
      method: 'GET',
      token,
    }
  );
}

export function quickCreateTenant(
  payload: { email: string; fullName: string; phoneNumber: string },
  propertyId: string,
  token: string
): Promise<UserSearchResponse> {
  return apiRequest<UserSearchResponse>(`/api/v1/user/create-tenant?propertyId=${encodeURIComponent(propertyId)}`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}
