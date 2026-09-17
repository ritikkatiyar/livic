import { apiRequest } from '@/src/api/client';
import type { PropertyResponse } from '@/src/types/property';

export interface PropertyListResponse {
  content: PropertyResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export async function getMyProperties(token: string, search?: string): Promise<PropertyResponse[]> {
  try {
    const url = search
      ? `/api/v1/properties?size=20&search=${encodeURIComponent(search)}`
      : `/api/v1/properties?size=20`;
    const response = await apiRequest<PropertyListResponse>(url, {
      method: 'GET',
      token,
    });
    return response?.content || [];
  } catch (err) {
    console.warn('[getMyProperties] Backend offline or unreachable, returning empty list.', err);
    return [];
  }
}
