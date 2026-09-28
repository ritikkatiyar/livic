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
  return apiRequest<MyContextResponse>('/api/v1/user/me/context', {
    method: 'GET',
    token,
  });
}
