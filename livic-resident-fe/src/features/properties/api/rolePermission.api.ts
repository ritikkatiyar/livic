import { apiRequest } from '@/src/api/client';
import type { ApiModel } from '@/src/api/models';

export type JoinCodeResultResponse = ApiModel<'JoinCodeResultResponse'>;

export function validateAndApplyJoinCode(token: string, code: string): Promise<JoinCodeResultResponse> {
  return apiRequest<JoinCodeResultResponse>(`/api/v1/properties/join-codes/validate`, {
    method: 'POST',
    body: JSON.stringify({ code }),
    token,
  });
}
