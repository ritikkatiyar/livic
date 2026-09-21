import { apiRequest } from '@/src/api/client';

export interface ChargeResponse {
  id: string;
  chargeType: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface RentCycleResponse {
  id: string;
  leaseId: string;
  blockId?: string | null;
  blockName?: string | null;
  tenantName: string;
  unitNumber: string;
  billingMonth: string;
  totalAmount: number;
  dueDate: string;
  status: 'PENDING' | 'PUBLISHED' | 'PAID' | 'OVERDUE';
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  charges: ChargeResponse[];
}

export interface BatchGenerateFailure {
  leaseId: string;
  unitNumber: string | null;
  reason: string;
}

export interface BatchGenerateResult {
  succeeded: RentCycleResponse[];
  failed: BatchGenerateFailure[];
}

export interface BatchPublishFailure {
  rentCycleId: string;
  unitNumber: string | null;
  reason: string;
}

export interface BatchPublishResult {
  succeeded: RentCycleResponse[];
  failed: BatchPublishFailure[];
}

export interface BatchUnpublishFailure {
  rentCycleId: string;
  unitNumber: string | null;
  reason: string;
}

export interface BatchUnpublishResult {
  succeeded: RentCycleResponse[];
  failed: BatchUnpublishFailure[];
}

export interface PreFlightChecklistResponse {
  totalUnits: number;
  activeLeases: number;
  meterReadingsExpected: number;
  meterReadingsEntered: number;
  isReady: boolean;
}

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
    '/api/v1/finance/rent-cycles/batch-generate',
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
    `/api/v1/finance/rent-cycles/pre-flight?propertyId=${propertyId}&billingMonth=${billingMonth}`,
    {
      method: 'GET',
      token
    }
  );
};

export interface BackendRentCycleListResponse {
  content: RentCycleResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  metrics: {
    totalExpectedRevenue: number;
    pendingDraftsCount: number;
    publishedCount: number;
  };
}

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

  const url = `/api/v1/finance/rent-cycles?${params.toString()}`;
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
    `/api/v1/finance/rent-cycles/${id}/publish`,
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
    `/api/v1/finance/rent-cycles/${id}/unpublish`,
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
    '/api/v1/finance/rent-cycles/batch-publish',
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
    '/api/v1/finance/rent-cycles/batch-unpublish',
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
    `/api/v1/finance/rent-cycles/${cycleId}/cash`,
    {
      method: 'POST',
      body: JSON.stringify({ amount, note }),
      token
    }
  );
};
