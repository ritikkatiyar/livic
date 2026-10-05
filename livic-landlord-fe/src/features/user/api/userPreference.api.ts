import { apiRequest } from '@/src/api/client';
import type { ApiInput, ApiModel } from '@/src/api/models';

export type UserActiveMode = 'RENTAL' | 'RESIDENTIAL';

export type SaveUserPreferenceRequest = ApiInput<'SaveUserPreferenceRequest'>;

export type UserPreferenceResponse = ApiModel<'UserPreferenceResponse'>;

export async function getUserPreference(token: string): Promise<UserPreferenceResponse> {
  return apiRequest<UserPreferenceResponse>('/api/v1/user/preference', {
    method: 'GET',
    token
  });
}

export async function saveUserPreference(request: SaveUserPreferenceRequest, token: string): Promise<UserPreferenceResponse> {
  return apiRequest<UserPreferenceResponse>('/api/v1/user/preference', {
    method: 'POST',
    body: JSON.stringify(request),
    token
  });
}
