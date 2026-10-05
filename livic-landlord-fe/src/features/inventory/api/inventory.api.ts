import { apiRequest } from '@/src/api/client';
import type { InventoryCondition, InventoryStatus } from '../mockInventoryData';
import type { ApiInput, ApiModel } from '@/src/api/models';

export type InventoryItemDTO = ApiModel<'InventoryItemResponse', 'unitId' | 'modelNumber' | 'nextService'>;

export type AssignmentItemDTO = ApiModel<'AssignmentItemResponse', 'assignmentId' | 'leaseId' | 'assignedAt'>;

export type VerificationItemDTO = ApiModel<'VerificationItemResponse', 'returnedAt' | 'settledAt'>;

export type InventoryStatsDTO = ApiModel<'InventoryStatsResponse'>;

export type CreateInventoryItemPayload = ApiInput<'CreateInventoryItemRequest'>;

export type UpdateInventoryItemPayload = ApiInput<'UpdateInventoryItemRequest'>;

export type CreateAssignmentItemPayload = ApiInput<'CreateAssignmentItemPayload'>;

export type ReturnVerificationPayload = ApiInput<'ReturnVerificationRequest'>;

export type ServiceExpensePayload = ApiInput<'ServiceExpenseRequest'>;

export async function getPropertyInventory(
  propertyId: string,
  token: string,
  params?: { q?: string; status?: string; scope?: string; serviceDueOnly?: boolean }
): Promise<InventoryItemDTO[]> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.append('q', params.q);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.scope) searchParams.append('scope', params.scope);
  if (params?.serviceDueOnly) searchParams.append('serviceDueOnly', 'true');

  const query = searchParams.toString();
  const url = `/api/v1/inventory/properties/${propertyId}/items${query ? `?${query}` : ''}`;
  return apiRequest<InventoryItemDTO[]>(url, { method: 'GET', token });
}

export async function createInventoryItem(
  payload: CreateInventoryItemPayload,
  token: string
): Promise<InventoryItemDTO> {
  return apiRequest<InventoryItemDTO>('/api/v1/inventory/items', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateInventoryItem(
  itemId: string,
  payload: UpdateInventoryItemPayload,
  token: string
): Promise<InventoryItemDTO> {
  return apiRequest<InventoryItemDTO>(`/api/v1/inventory/items/${itemId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
}

export async function getInventoryItem(
  itemId: string,
  token: string
): Promise<InventoryItemDTO> {
  return apiRequest<InventoryItemDTO>(`/api/v1/inventory/items/${itemId}`, {
    method: 'GET',
    token,
  });
}

export async function getInventoryStats(
  propertyId: string,
  token: string
): Promise<InventoryStatsDTO> {
  return apiRequest<InventoryStatsDTO>(`/api/v1/inventory/properties/${propertyId}/stats`, {
    method: 'GET',
    token,
  });
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export async function getLeaseAssignments(
  leaseId: string,
  token: string,
  page = 0,
  size = 50
): Promise<AssignmentItemDTO[]> {
  const res = await apiRequest<PageResponse<AssignmentItemDTO> | AssignmentItemDTO[]>(
    `/api/v1/inventory/leases/${leaseId}/assignments?page=${page}&size=${size}`,
    {
      method: 'GET',
      token,
    }
  );
  return Array.isArray(res) ? res : (res?.content ?? []);
}

export async function createLeaseAssignments(
  leaseId: string,
  payload: { items: CreateAssignmentItemPayload[] },
  token: string
): Promise<AssignmentItemDTO[]> {
  return apiRequest<AssignmentItemDTO[]>(`/api/v1/inventory/leases/${leaseId}/assignments`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function generateMoveOutChecklist(
  leaseId: string,
  token: string
): Promise<VerificationItemDTO[]> {
  return apiRequest<VerificationItemDTO[]>(`/api/v1/inventory/leases/${leaseId}/move-out-checklist`, {
    method: 'POST',
    token,
    body: JSON.stringify({}),
  });
}

export async function getVerificationChecklist(
  leaseId: string,
  token: string,
  page = 0,
  size = 50
): Promise<VerificationItemDTO[]> {
  const res = await apiRequest<PageResponse<VerificationItemDTO> | VerificationItemDTO[]>(
    `/api/v1/inventory/leases/${leaseId}/verification-checklist?page=${page}&size=${size}`,
    {
      method: 'GET',
      token,
    }
  );
  return Array.isArray(res) ? res : (res?.content ?? []);
}

export async function verifyReturn(
  assignmentId: string,
  payload: ReturnVerificationPayload,
  token: string
): Promise<VerificationItemDTO> {
  return apiRequest<VerificationItemDTO>(`/api/v1/inventory/assignments/${assignmentId}/return-verification`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
}

export async function approveDeductions(
  leaseId: string,
  payload: { assignmentIds?: string[]; approveAll?: boolean },
  token: string
): Promise<VerificationItemDTO[]> {
  return apiRequest<VerificationItemDTO[]>(`/api/v1/inventory/leases/${leaseId}/deductions/approve`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function recordServiceExpense(
  itemId: string,
  payload: ServiceExpensePayload,
  token: string
): Promise<any> {
  return apiRequest<any>(`/api/v1/inventory/items/${itemId}/service-expenses`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function getTenantVisibleItems(
  propertyId: string,
  token: string
): Promise<{ unitItems: InventoryItemDTO[]; sharedItems: InventoryItemDTO[] }> {
  return apiRequest<{ unitItems: InventoryItemDTO[]; sharedItems: InventoryItemDTO[] }>(
    `/api/v1/inventory/my-visible-items?propertyId=${propertyId}`,
    { method: 'GET', token }
  );
}
