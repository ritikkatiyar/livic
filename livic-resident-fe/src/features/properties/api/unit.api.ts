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

export type UnitResponse = ApiModel<'UnitResponse', 'activeLeases'>;

export type ActiveLeaseSummary = ApiModel<'ActiveLeaseSummary', 'tenantName' | 'tenantPhone', 'tenantName' | 'tenantPhone'>;

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
