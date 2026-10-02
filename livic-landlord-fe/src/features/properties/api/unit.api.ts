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

export type UnitResponse = ApiModel<'UnitResponse', 'blockId' | 'activeLeases', 'blockId'>;

export type ActiveLeaseSummary = ApiModel<'ActiveLeaseSummary', 'tenantName' | 'tenantPhone', 'tenantName' | 'tenantPhone'>;

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
