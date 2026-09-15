import { apiRequest } from '@/src/api/client';

export interface PermissionFeature {
  code: string;
  label: string;
  description: string;
}

export interface PermissionModule {
  module: string;
  features: PermissionFeature[];
}

export function getPermissionCatalog(token: string): Promise<PermissionModule[]> {
  return apiRequest<PermissionModule[]>('/api/v1/permissions/catalog', {
    method: 'GET',
    token,
  });
}
