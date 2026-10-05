import { apiRequest } from '@/src/api/client';
import type { ApiModel } from '@/src/api/models';

export type UserPreference = ApiModel<'UserPreferenceResponse', never, 'activeMode'>;

export const getPreference = async (token: string): Promise<UserPreference> => {
  return apiRequest<UserPreference>('/api/v1/user/preference', {
    method: 'GET',
    token,
  });
};

export const savePreference = async (token: string, activeMode: string): Promise<void> => {
  return apiRequest<void>('/api/v1/user/preference', {
    method: 'POST',
    token,
    body: JSON.stringify({ activeMode }),
  });
};
