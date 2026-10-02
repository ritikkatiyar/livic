import { apiRequest } from '@/src/api/client';
import type { ApiInput, ApiModel } from '@/src/api/models';

export type MessageChannel = 'SMS' | 'WHATSAPP';

export type ChannelChoice = ApiModel<'ChannelChoice'>;

export type TourMessageSettings = ApiModel<'TourMessageSettingsResponse'>;

export type UpdateTourMessageSettingsRequest = ApiInput<'UpdateTourMessageSettingsRequest'>;

export async function getTourMessageSettings(propertyId: string, token: string): Promise<TourMessageSettings> {
  return apiRequest<TourMessageSettings>(`/api/v1/marketplace/properties/${propertyId}/tour-message-settings`, { token });
}

export async function updateTourMessageSettings(
  propertyId: string,
  request: UpdateTourMessageSettingsRequest,
  token: string
): Promise<TourMessageSettings> {
  return apiRequest<TourMessageSettings>(`/api/v1/marketplace/properties/${propertyId}/tour-message-settings`, {
    method: 'PUT',
    token,
    body: JSON.stringify(request),
  });
}
