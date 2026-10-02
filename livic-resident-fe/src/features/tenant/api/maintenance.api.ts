import { apiRequest } from '@/src/api/client';
import type { ApiInput, ApiModel } from '@/src/api/models';

export type MaintenanceTicket = ApiModel<'IssueResponse', 'tenantId' | 'leaseId' | 'unitId' | 'assignedContactPhone', 'tenantId' | 'leaseId' | 'unitId' | 'assignedContactPhone'>;

type IssueInput = ApiInput<'CreateIssueRequest'>;

/** A resident's issue: the wrapper below fills scope, contact and priority when they are left out. */
export type CreateTicketRequest = Omit<IssueInput, 'scope' | 'assignedContactName' | 'priority'>
  & Partial<Pick<IssueInput, 'scope' | 'assignedContactName' | 'priority'>>;

export interface TicketHealthStats {
  totalTickets: number;
  pendingCount: number;
  resolvedCount: number;
}

export function getMaintenanceTickets(token: string): Promise<MaintenanceTicket[]> {
  return apiRequest<any>('/api/v1/issues', {
    method: 'GET',
    token,
  }).then((res) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.content)) return res.content;
    return [];
  });
}

export function createMaintenanceTicket(token: string, data: CreateTicketRequest): Promise<MaintenanceTicket> {
  const payload = {
    ...data,
    scope: data.scope || 'UNIT',
    assignedContactName: data.assignedContactName || 'Tenant Support',
    assignedContactPhone: data.assignedContactPhone || '',
    priority: data.priority || 'STANDARD',
  } satisfies IssueInput;
  return apiRequest<MaintenanceTicket>('/api/v1/issues', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function getTicketHealthStats(token: string): Promise<TicketHealthStats> {
  return apiRequest<any>('/api/v1/issues', {
    method: 'GET',
    token,
  }).then((res) => {
    const tickets = Array.isArray(res) ? res : (res && Array.isArray(res.content) ? res.content : []);
    const totalTickets = tickets.length;
    const pendingCount = tickets.filter((t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'PENDING').length;
    const resolvedCount = tickets.filter((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    return {
      totalTickets,
      pendingCount,
      resolvedCount,
    };
  });
}
