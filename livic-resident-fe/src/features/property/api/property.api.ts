import { apiRequest } from '@/src/api/client';
import type { ApiModel } from '@/src/api/models';

export type PropertyDetailsResponse = ApiModel<'PropertyResponse', 'landmark'>;

export async function getPropertyDetails(propertyId: string, token: string): Promise<PropertyDetailsResponse | null> {
  try {
    const res = await apiRequest<PropertyDetailsResponse>(`/api/v1/properties/${propertyId}`, {
      method: 'GET',
      token,
    });
    return res;
  } catch (err: any) {
    console.warn('[Property API] Failed to fetch property details:', err?.message);
    return null;
  }
}
