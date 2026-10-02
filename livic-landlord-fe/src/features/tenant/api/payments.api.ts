import { apiRequest, apiRawTextRequest } from '@/src/api/client';
import type { ApiModel } from '@/src/api/models';

export type RentCycle = ApiModel<'BillResponse', 'paidAt', 'paidAt'>;

export function getTenantRentCycles(token: string, leaseId?: string): Promise<RentCycle[]> {
  // A lease's bills come from rental; without one, the caller's own bills come from core.
  const path = leaseId ? `/api/v1/finance/leases/${leaseId}/bills` : '/api/v1/finance/bills';
  return apiRequest<any>(path, {
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
