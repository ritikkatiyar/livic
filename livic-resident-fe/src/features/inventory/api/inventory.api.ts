import { apiRequest } from '@/src/api/client';
import type { ApiModel } from '@/src/api/models';

export type BackendInventoryItem = ApiModel<'InventoryItemResponse', 'unitId' | 'location' | 'modelNumber' | 'nextService' | 'value' | 'icon' | 'image' | 'notes' | 'createdAt', 'unitId' | 'location' | 'modelNumber' | 'nextService' | 'value' | 'icon' | 'image' | 'notes'>;

export type TenantVisibleInventoryResponse = ApiModel<'TenantVisibleInventoryResponse'>;

export async function getTenantVisibleInventory(token: string, propertyId?: string): Promise<TenantVisibleInventoryResponse> {
  try {
    const url = propertyId ? `/api/v1/inventory/my-visible-items?propertyId=${propertyId}` : '/api/v1/inventory/my-visible-items';
    const data = await apiRequest<TenantVisibleInventoryResponse>(url, {
      method: 'GET',
      token,
    });
    return data || { unitItems: [], sharedItems: [] };
  } catch (err: any) {
    console.warn('[Inventory API] Failed to fetch tenant inventory:', err?.message);
    return { unitItems: [], sharedItems: [] };
  }
}
