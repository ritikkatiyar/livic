import { apiRequest } from '@/src/api/client';
import type { ApiModel } from '@/src/api/models';

export type ResidentNotificationPreferences = ApiModel<'UserNotificationPreferencesDTO'>;

export async function getResidentNotificationPreferences(
  token: string
): Promise<ResidentNotificationPreferences> {
  return apiRequest<ResidentNotificationPreferences>('/api/v1/user/notification-preferences', {
    method: 'GET',
    token,
  });
}

export async function updateResidentNotificationPreferences(
  token: string,
  preferences: ResidentNotificationPreferences
): Promise<ResidentNotificationPreferences> {
  return apiRequest<ResidentNotificationPreferences>('/api/v1/user/notification-preferences', {
    method: 'PUT',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferences),
  });
}
