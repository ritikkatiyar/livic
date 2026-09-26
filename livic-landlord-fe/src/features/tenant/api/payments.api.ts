import { apiRequest, apiRawTextRequest } from '@/src/api/client';

export interface RentCycle {
  id: string;
  leaseId: string;
  billingMonth: string;
  rentAmount: number;
  utilityAmount: number;
  totalAmount: number;
  dueDate: string;
  status: 'PENDING' | 'PUBLISHED' | 'PAID' | 'OVERDUE';
  paidAt?: string | null;
}

export function getTenantRentCycles(token: string, leaseId?: string): Promise<RentCycle[]> {
  const query = leaseId ? `?leaseId=${leaseId}` : '';
  return apiRequest<any>(`/api/v1/finance/bills${query}`, {
    method: 'GET',
    token,
  }).then((res) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.content)) return res.content;
    return [];
  }).catch((err) => {
    console.warn('[Payments API] Failed to load rent cycles:', err?.message);
    return [];
  });
}

export function markRentCyclePaid(token: string, cycleId: string): Promise<RentCycle> {
  return apiRequest<RentCycle>(`/api/v1/finance/bills/${cycleId}/mark-paid`, {
    method: 'POST',
    token,
  });
}

/**
 * Fetches the payment statement HTML for a rent cycle.
 * The Authorization header is sent via apiRawTextRequest — no token in the URL.
 */
export function fetchStatementHtml(cycleId: string, token: string): Promise<string> {
  return apiRawTextRequest(`/api/v1/finance/bills/${cycleId}/invoice`, { token });
}
