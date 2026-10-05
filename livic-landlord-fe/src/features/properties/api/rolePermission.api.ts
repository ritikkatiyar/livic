import { apiRequest } from '@/src/api/client';
import type { ApiModel } from '@/src/api/models';

export type JoinCodeResponse = ApiModel<'JoinCodeResponse', 'permissionCodes'>;

export type JoinCodeResultResponse = ApiModel<'JoinCodeResultResponse'>;

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export function generateJoinCode(
  token: string,
  propertyId: string,
  data: { title?: string; accessType?: 'FULL_ACCESS' | 'CUSTOM_ACCESS'; permissionCodes?: string[]; maxUses: number }
): Promise<JoinCodeResponse> {
  return apiRequest<JoinCodeResponse>(`/api/v1/properties/${propertyId}/join-codes`, {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

export async function getPropertyJoinCodes(token: string, propertyId: string): Promise<JoinCodeResponse[]> {
  const res = await apiRequest<PageResponse<JoinCodeResponse>>(`/api/v1/properties/${propertyId}/join-codes`, {
    method: 'GET',
    token,
  });
  return res?.content || [];
}

export function validateAndApplyJoinCode(token: string, code: string): Promise<JoinCodeResultResponse> {
  return apiRequest<JoinCodeResultResponse>(`/api/v1/properties/join-codes/validate`, {
    method: 'POST',
    body: JSON.stringify({ code }),
    token,
  });
}
