import { apiRequest } from '@/src/api/client';

/**
 * Blocks are the buildings inside one property.
 *
 * Every property has at least one, created for it and named "Main", so a landlord with a
 * single building never sees the concept. Two buildings on one plot belong in one property
 * with two blocks — that keeps their staff, charges and books together.
 */
export interface BlockResponse {
  id: string;
  propertyId: string;
  name: string;
  sortOrder: number;
  isDefault: boolean;
  totalFloors: number | null;
  unitCount: number;
}

export interface BlockRequest {
  name: string;
  totalFloors?: number | null;
  sortOrder?: number | null;
}

export function getBlocks(propertyId: string, token: string): Promise<BlockResponse[]> {
  return apiRequest<BlockResponse[]>(`/api/v1/properties/${propertyId}/blocks`, {
    method: 'GET',
    token,
  });
}

export function createBlock(propertyId: string, request: BlockRequest, token: string): Promise<BlockResponse> {
  return apiRequest<BlockResponse>(`/api/v1/properties/${propertyId}/blocks`, {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  });
}

export function updateBlock(
  propertyId: string,
  blockId: string,
  request: BlockRequest,
  token: string
): Promise<BlockResponse> {
  return apiRequest<BlockResponse>(`/api/v1/properties/${propertyId}/blocks/${blockId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(request),
  });
}

export function deleteBlock(propertyId: string, blockId: string, token: string): Promise<void> {
  return apiRequest<void>(`/api/v1/properties/${propertyId}/blocks/${blockId}`, {
    method: 'DELETE',
    token,
  });
}

/**
 * Whether this property should show the block level at all. One block that is the default
 * means nothing to choose between, so the apps go straight to its floors.
 */
export function shouldShowBlocks(blocks: BlockResponse[]): boolean {
  return blocks.length > 1;
}
