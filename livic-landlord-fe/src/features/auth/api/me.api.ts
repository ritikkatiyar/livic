import { apiRequest } from '@/src/api/client';

export interface MembershipSummary {
  propertyId: string;
  propertyName: string;
  title: string;
  accessType?: 'FULL_ACCESS' | 'CUSTOM_ACCESS';
  /** Effective staff permission codes on this property; FULL_ACCESS members receive every code. */
  permissionCodes?: string[];
}

export interface ActiveLeaseSummary {
  leaseId: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitNumber: string;
  rentAmount: number;
  status: string;
}

export interface MyContextResponse {
  globalRole: string;
  managedProperties: MembershipSummary[];
  tenantProperties: MembershipSummary[];
  activeLeases: ActiveLeaseSummary[];
  isLandlord: boolean;
  isTenant: boolean;
}

export function getMyContext(token: string): Promise<MyContextResponse> {
  return apiRequest<MyContextResponse>('/api/v1/user/me/context', {
    method: 'GET',
    token,
  });
}
