import { apiRequest, apiRawTextRequest } from '@/src/api/client';
import type { ApiModel } from '@/src/api/models';

export type RentCycle = ApiModel<'BillResponse', 'paidAt', 'paidAt'>;

export function getTenantRentCycles(token: string, leaseId?: string): Promise<RentCycle[]> {
  // A lease's bills come from rental; without one, the bills the caller pays come from /me.
  const path = leaseId ? `/api/v1/finance/leases/${leaseId}/bills` : '/api/v1/me/bills';
  return apiRequest<any>(path, {
    method: 'GET',
    token,
  }).then((res) => {
    const list: RentCycle[] = Array.isArray(res) ? res : (res && Array.isArray(res.content) ? res.content : []);
    return list.filter((c: RentCycle) => c.status !== 'PENDING');
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
