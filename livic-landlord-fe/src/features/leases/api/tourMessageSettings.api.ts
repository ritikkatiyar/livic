import { apiRequest } from '@/src/api/client';

export type MessageChannel = 'SMS' | 'WHATSAPP';

export interface ChannelChoice {
  sms: boolean;
  whatsapp: boolean;
}

export interface TourMessageSettings {
  propertyId: string;
  /** False while the property still uses the defaults (every channel on). */
  customized: boolean;
  /** Sent when you approve or decline a request. */
  decision: ChannelChoice;
  /** Sent 2 hours before an approved visit. */
  reminder: ChannelChoice;
  /** Channels the platform can deliver; the others can't be turned on. The API may also list other channels. */
  availableChannels: string[];
}

export interface UpdateTourMessageSettingsRequest {
  decision: ChannelChoice;
  reminder: ChannelChoice;
}

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
