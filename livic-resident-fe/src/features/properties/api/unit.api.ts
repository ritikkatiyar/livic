import { apiRequest } from '@/src/api/client';
import type { ApiInput, ApiModel } from '@/src/api/models';

export type FloorSummaryResponse = ApiModel<'FloorSummaryResponse'>;

export function getFloorSummaries(propertyId: string, token: string, throughFloor?: number): Promise<FloorSummaryResponse[]> {
  const query = throughFloor !== undefined ? `?throughFloor=${throughFloor}` : '';
  const path = `/api/v1/properties/${propertyId}/floors${query}`;

  return apiRequest<FloorSummaryResponse[]>(path, {
    method: 'GET',
    token,
  });
}

/** What a member holds the unit under, such as a lease; owners and family usually have none. */
export type MemberAgreement = ApiModel<'MemberAgreement', 'monthlyAmount' | 'startDate' | 'endDate' | 'status', 'monthlyAmount' | 'startDate' | 'endDate' | 'status'>;

export type Occupant = Omit<ApiModel<'Occupant', 'userId' | 'name' | 'phone' | 'fromDate', 'userId' | 'name' | 'phone' | 'fromDate'>, 'agreement'> & {
  agreement?: MemberAgreement | null;
};

export type UnitResponse = Omit<ApiModel<'UnitResponse', 'blockId', 'blockId'>, 'members'> & {
  members?: Occupant[];
};

export function getFloorLayout(propertyId: string, floorNumber: number, token: string): Promise<UnitResponse[]> {
  const path = `/api/v1/properties/${propertyId}/floors/${floorNumber}/layout`;
  return apiRequest<UnitResponse[]>(path, {
    method: 'GET',
    token,
  });
}

export function getAllFloorsLayout(propertyId: string, token: string): Promise<UnitResponse[]> {
  const path = `/api/v1/properties/${propertyId}/floors/layouts`;
  return apiRequest<UnitResponse[]>(path, {
    method: 'GET',
    token,
  });
}

export type BatchUnitRequest = ApiInput<'BatchUnitRequest'>;

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
  layout: any[]
): Promise<UnitResponse[]> {
  const path = `/api/v1/properties/${propertyId}/floors/${floorNumber}/layout`;
  return apiRequest<UnitResponse[]>(path, {
    method: 'PUT',
    token,
    body: JSON.stringify(layout),
  });
}
