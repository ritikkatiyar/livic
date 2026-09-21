import { apiRequest } from '@/src/api/client';

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface IssueTimelineResponse {
  id: string;
  authorUserId: string;
  authorName: string;
  entryType: 'CREATION' | 'STATUS_CHANGE' | 'ESCALATION' | 'COMMENT';
  content: string;
  createdAt: string;
}

export interface IssueResponse {
  id: string;
  propertyId: string;
  blockId?: string;
  blockName?: string;
  unitId?: string;
  leaseId?: string;
  tenantId?: string;
  reportedByUserId: string;
  title: string;
  description: string;
  category: 'GENERAL' | 'PLUMBING' | 'ELECTRICAL' | 'STRUCTURAL' | 'SECURITY' | 'CLEANLINESS' | 'INTERNET' | 'OTHER';
  priority: 'LOW' | 'STANDARD' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  scope: 'UNIT' | 'BUILDING' | 'COMMON_AREA';
  escalationStatus: 'NONE' | 'ESCALATED' | 'RESOLVED';
  escalationLevel: number;
  assignedContactName: string;
  assignedContactPhone?: string;
  createdAt: string;
  updatedAt: string;
  ticketNumber: string;
  timeline: IssueTimelineResponse[];
}

export const getIssues = async (
  token: string,
  page: number = 0,
  size: number = 20,
  blockId?: string | null
): Promise<PaginatedResponse<IssueResponse>> => {
  let url = `/api/v1/issues?page=${page}&size=${size}`;
  if (blockId) url += `&blockId=${blockId}`;
  return await apiRequest<PaginatedResponse<IssueResponse>>(url, {
    method: 'GET',
    token
  });
};

export const getIssueDetails = async (
  id: string,
  token: string
): Promise<IssueResponse> => {
  return await apiRequest<IssueResponse>(`/api/v1/issues/${id}`, {
    method: 'GET',
    token
  });
};

export const addCommentToIssue = async (
  id: string,
  content: string,
  token: string
): Promise<IssueResponse> => {
  return await apiRequest<IssueResponse>(`/api/v1/issues/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
    token
  });
};

export const updateIssueStatus = async (
  id: string,
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
  token: string,
  comment?: string
): Promise<IssueResponse> => {
  return await apiRequest<IssueResponse>(`/api/v1/issues/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, comment }),
    token
  });
};

export const escalateIssue = async (
  id: string,
  reason: string,
  token: string
): Promise<IssueResponse> => {
  return await apiRequest<IssueResponse>(`/api/v1/issues/${id}/escalate`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
    token
  });
};
