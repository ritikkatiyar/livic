import { apiRequest } from '@/src/api/client';
import type { ApiModel } from '@/src/api/models';

export type MembershipSummary = ApiModel<'MembershipSummary', 'accessType' | 'permissionCodes'>;

export type ActiveLeaseSummary = ApiModel<'ActiveLeaseSummary'>;

export type MyContextResponse = ApiModel<'MyContextResponse'>;

export function getMyContext(token: string): Promise<MyContextResponse> {
  return apiRequest<MyContextResponse>('/api/v1/me/context', {
    method: 'GET',
    token,
  });
}
