import { apiRequest } from '@/src/api/client';
import type { ApiModel } from '@/src/api/models';

/** One line of a bill. The amount is signed: a discount or adjustment in the payer's favour is negative. */
export type ChargeResponse = ApiModel<'ChargeResponse'>;

export type RentCycleResponse = ApiModel<'BillResponse', 'blockId' | 'blockName', 'blockId' | 'blockName' | 'paidAt'>;

export type BatchGenerateFailure = ApiModel<'BatchGenerateFailure', never, 'unitNumber'>;

export type BatchGenerateResult = ApiModel<'BatchGenerateResult'>;

export type BatchPublishFailure = ApiModel<'BatchPublishFailure', never, 'unitNumber'>;

export type BatchPublishResult = ApiModel<'BatchPublishResult'>;

export type BatchUnpublishFailure = ApiModel<'BatchUnpublishFailure', never, 'unitNumber'>;

export type BatchUnpublishResult = ApiModel<'BatchUnpublishResult'>;

/** totalBeds sums unit capacities: activeLeases counts tenants, so it is measured against beds, not units. */
export type PreFlightChecklistResponse = ApiModel<'PreFlightChecklistResponse', 'totalBeds'>;

export const batchGenerateRentCycle = async (
  propertyId: string,
  billingMonth: string,
  dueDate: string,
  token: string,
  blockId?: string | null
): Promise<BatchGenerateResult> => {
  const body: Record<string, any> = { propertyId, billingMonth, dueDate };
  if (blockId) body.blockId = blockId;
  return await apiRequest<BatchGenerateResult>(
    '/api/v1/finance/bills/batch-generate',
    {
      method: 'POST',
      body: JSON.stringify(body),
      token
    }
  );
};

export const getPreFlightChecklist = async (
  propertyId: string,
  billingMonth: string,
  token: string
): Promise<PreFlightChecklistResponse> => {
  return await apiRequest<PreFlightChecklistResponse>(
    `/api/v1/finance/bills/pre-flight?propertyId=${propertyId}&billingMonth=${billingMonth}`,
    {
      method: 'GET',
      token
    }
  );
};

export type BackendRentCycleListResponse = ApiModel<'BillListResponse'>;

export interface RentCycleListResponse {
  content: RentCycleResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  totalExpectedRevenue: number;
  pendingDraftsCount: number;
  publishedCount: number;
}

export const listRentCycles = async (
  billingMonth: string,
  token: string,
  propertyId?: string,
  page: number = 0,
  size: number = 20,
  status?: string,
  search?: string,
  blockId?: string | null
): Promise<RentCycleListResponse> => {
  const params = new URLSearchParams();
  if (billingMonth) params.append('billingMonth', billingMonth);
  if (propertyId && propertyId !== 'ALL') params.append('propertyId', propertyId);
  if (blockId) params.append('blockId', blockId);
  if (status && status !== 'ALL') params.append('status', status);
  if (search && search.trim()) params.append('search', search.trim());
  params.append('page', String(page));
  params.append('size', String(size));

  const url = `/api/v1/finance/bills?${params.toString()}`;
  const response = await apiRequest<BackendRentCycleListResponse>(url, {
    method: 'GET',
    token
  });
  return {
    content: response?.content || [],
    totalElements: response?.totalElements || 0,
    totalPages: response?.totalPages || 0,
    size: response?.size || size,
    number: response?.number || page,
    totalExpectedRevenue: response?.metrics?.totalExpectedRevenue || 0,
    pendingDraftsCount: response?.metrics?.pendingDraftsCount || 0,
    publishedCount: response?.metrics?.publishedCount || 0
  };
};

export const publishRentCycle = async (
  id: string,
  token: string
): Promise<RentCycleResponse> => {
  return await apiRequest<RentCycleResponse>(
    `/api/v1/finance/bills/${id}/publish`,
    {
      method: 'POST',
      token
    }
  );
};

export const unpublishRentCycle = async (
  id: string,
  token: string
): Promise<RentCycleResponse> => {
  return await apiRequest<RentCycleResponse>(
    `/api/v1/finance/bills/${id}/unpublish`,
    {
      method: 'POST',
      token
    }
  );
};

export const batchPublishRentCycle = async (
  propertyId: string,
  billingMonth: string,
  token: string
): Promise<BatchPublishResult> => {
  return await apiRequest<BatchPublishResult>(
    '/api/v1/finance/bills/batch-publish',
    {
      method: 'POST',
      body: JSON.stringify({ propertyId, billingMonth }),
      token
    }
  );
};

export const batchUnpublishRentCycle = async (
  propertyId: string,
  billingMonth: string,
  token: string
): Promise<BatchUnpublishResult> => {
  return await apiRequest<BatchUnpublishResult>(
    '/api/v1/finance/bills/batch-unpublish',
    {
      method: 'POST',
      body: JSON.stringify({ propertyId, billingMonth }),
      token
    }
  );
};

export const recordCashPayment = async (
  cycleId: string,
  amount: number,
  note: string,
  token: string
): Promise<any> => {
  return await apiRequest<any>(
    `/api/v1/finance/bills/${cycleId}/cash`,
    {
      method: 'POST',
      body: JSON.stringify({ amount, note }),
      token
    }
  );
};
