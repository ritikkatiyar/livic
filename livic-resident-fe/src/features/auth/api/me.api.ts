import { apiRequest } from '@/src/api/client';
import type { ApiInput, ApiModel } from '@/src/api/models';

export type MembershipSummary = ApiModel<'MembershipSummary', 'accessType'>;

/** A unit this person belongs to, as owner, tenant or family member. */
export type UnitMembershipSummary = ApiModel<'UnitMembershipSummary', never, 'floor' | 'propertyName'>;

export type MyContextResponse = ApiModel<'MyContextResponse'>;

export function getMyContext(token: string): Promise<MyContextResponse> {
  return apiRequest<MyContextResponse>('/api/v1/me/context', {
    method: 'GET',
    token,
  });
}

export type MyProfile = ApiModel<'ProfileResponse'>;

export type UpdateMyProfileRequest = ApiInput<'UpdateProfileRequest'>;

export function getMyProfile(token: string): Promise<MyProfile | null> {
  return apiRequest<MyProfile>('/api/v1/me/profile', {
    method: 'GET',
    token,
  }).catch((err) => {
    console.warn('[Profile API] Failed to fetch profile:', err?.message);
    return null;
  });
}

export function updateMyProfile(token: string, data: UpdateMyProfileRequest): Promise<MyProfile> {
  return apiRequest<MyProfile>('/api/v1/me/profile', {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  });
}
