import { apiRequest } from '@/src/api/client';

export interface FloorSummaryResponse {
  floorNumber: number;
  displayLabel: string;
  configured: boolean;
  unitCount: number;
}

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

export interface UnitResponse {
  id: string;
  blockId?: string | null;
  unitNumber: string;
  floor: number;
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  type: string;
  capacity: number;
  facing: string;
  activeLeases?: ActiveLeaseSummary[];
}

export interface ActiveLeaseSummary {
  leaseId: string;
  tenantUserId: string;
  tenantName?: string | null;
  tenantPhone?: string | null;
  rentAmount: number;
  status: string;
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

export interface BatchUnitRequest {
  totalFloors: number;
  unitsPerFloor: number;
  startingFloorNumber: number;
  prefix: string;
  capacity: number;
  unitType: string;
  /** Null means the property's default block. */
  blockId?: string | null;
}

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
