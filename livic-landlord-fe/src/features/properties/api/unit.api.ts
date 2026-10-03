import { apiRequest } from '@/src/api/client';
import type { ApiInput, ApiModel } from '@/src/api/models';

export type FloorSummaryResponse = ApiModel<'FloorSummaryResponse'>;

/** Floors belong to a block. Omitting blockId means the property's default block. */
export function getFloorSummaries(
  propertyId: string,
  token: string,
  throughFloor?: number,
  blockId?: string | null
): Promise<FloorSummaryResponse[]> {
  const params = new URLSearchParams();
  if (throughFloor !== undefined) params.set('throughFloor', String(throughFloor));
  if (blockId) params.set('blockId', blockId);
  const query = params.toString() ? `?${params.toString()}` : '';
  const path = `/api/v1/properties/${propertyId}/floors${query}`;

  return apiRequest<FloorSummaryResponse[]>(path, {
    method: 'GET',
    token,
  });
}

/** What a member holds the unit under; in this app, always a lease (`id` is the lease ID). */
export type MemberAgreement = ApiModel<'MemberAgreement', 'monthlyAmount' | 'startDate' | 'endDate' | 'status', 'monthlyAmount' | 'startDate' | 'endDate' | 'status'>;

/** A person in the unit: a tenant with their lease, or an owner or family member with no agreement. */
export type Occupant = Omit<ApiModel<'Occupant', 'userId' | 'name' | 'phone' | 'fromDate', 'userId' | 'name' | 'phone' | 'fromDate'>, 'agreement'> & {
  agreement?: MemberAgreement | null;
};

export type UnitResponse = Omit<ApiModel<'UnitResponse', 'blockId', 'blockId'>, 'members'> & {
  members?: Occupant[];
};

/** The unit's tenants, in the order the backend lists its members. */
export function tenantsOf(members: Occupant[] | null | undefined): Occupant[] {
  return (members || []).filter(m => m.role === 'TENANT');
}

/** The tenant a new lease adds, to show before the layout is next loaded. */
export function occupantFromLease(
  lease: { id: string; memberId: string; userId: string; monthlyRentAmount: number; moveInDate: string },
  name: string | null | undefined,
  phone: string | null | undefined,
): Occupant {
  return {
    memberId: lease.memberId,
    userId: lease.userId,
    name: name ?? null,
    phone: phone ?? null,
    role: 'TENANT',
    fromDate: lease.moveInDate,
    agreement: { id: lease.id, monthlyAmount: lease.monthlyRentAmount, startDate: lease.moveInDate, endDate: null, status: 'ACTIVE' },
  };
}

export function getFloorLayout(
  propertyId: string,
  floorNumber: number,
  token: string,
  blockId?: string | null
): Promise<UnitResponse[]> {
  const query = blockId ? `?blockId=${blockId}` : '';
  const path = `/api/v1/properties/${propertyId}/floors/${floorNumber}/layout${query}`;
  return apiRequest<UnitResponse[]>(path, {
    method: 'GET',
    token,
  });
}

export function getAllFloorsLayout(propertyId: string, token: string, blockId?: string | null): Promise<UnitResponse[]> {
  const query = blockId ? `?blockId=${blockId}` : '';
  const path = `/api/v1/properties/${propertyId}/floors/layouts${query}`;
  return apiRequest<UnitResponse[]>(path, {
    method: 'GET',
    token,
  });
}

/** The unit type's code; the backend accepts it as well as the display name it sends back. */
export type UnitTypeCode = 'SINGLE_UNIT' | 'SHARED_UNIT' | 'ONE_BHK' | 'TWO_BHK' | 'STUDIO';

export type BatchUnitRequest = Omit<ApiInput<'BatchUnitRequest'>, 'unitType'> & { unitType?: UnitTypeCode | null };

export function generateBatchUnits(propertyId: string, request: BatchUnitRequest, token: string): Promise<UnitResponse[]> {
  const path = `/api/v1/properties/${propertyId}/units/batch`;
  return apiRequest<UnitResponse[]>(path, {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  });
}

export function saveFloorLayout(
  propertyId: string,
  floorNumber: number,
  token: string,
  layout: any[],
  blockId?: string | null
): Promise<UnitResponse[]> {
  const query = blockId ? `?blockId=${blockId}` : '';
  const path = `/api/v1/properties/${propertyId}/floors/${floorNumber}/layout${query}`;
  return apiRequest<UnitResponse[]>(path, {
    method: 'PUT',
    token,
    body: JSON.stringify(layout),
  });
}
