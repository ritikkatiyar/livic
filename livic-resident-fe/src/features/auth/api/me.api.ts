import { apiRequest } from '@/src/api/client';

export interface MembershipSummary {
  propertyId: string;
  propertyName: string;
  title: string;
  accessType?: 'FULL_ACCESS' | 'CUSTOM_ACCESS';
}

/** A unit this person belongs to, as owner, tenant or family member. */
export interface UnitMembershipSummary {
  memberId: string;
  unitId: string;
  unitNumber: string;
  floor: number | null;
  propertyId: string;
  propertyName: string | null;
  role: 'OWNER' | 'TENANT' | 'FAMILY';
  leaseId: string | null;
}

export interface MyContextResponse {
  globalRole: string;
  managedProperties: MembershipSummary[];
  tenantProperties: MembershipSummary[];
  isLandlord: boolean;
  isTenant: boolean;
  unitMemberships: UnitMembershipSummary[];
}

export function getMyContext(token: string): Promise<MyContextResponse> {
  return apiRequest<MyContextResponse>('/api/v1/me/context', {
    method: 'GET',
    token,
  });
}

export interface MyProfile {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface UpdateMyProfileRequest {
  phone?: string;
}

export function getMyProfile(token: string): Promise<MyProfile | null> {
  return apiRequest<MyProfile>('/api/v1/me/profile', {
    method: 'GET',
    token,
  }).catch((err) => {
    console.warn('[Profile API] Failed to fetch profile:', err?.message);
    return null;
  });
}

export function updateMyProfile(token: string, data: UpdateMyProfileRequest): Promise<MyProfile> {
  return apiRequest<MyProfile>('/api/v1/me/profile', {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  });
}
