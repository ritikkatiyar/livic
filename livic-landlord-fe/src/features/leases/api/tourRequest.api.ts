import { apiRequest } from '@/src/api/client';

/** Backend lead status for a tour request. `NEW` means pending the landlord's decision. */
export type TourRequestStatus = 'NEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';

export type TourRequestFilter = 'PENDING' | 'UPCOMING' | 'PAST';

export interface TourRequestResponse {
  id: string;
  propertyId: string;
  unitId: string;
  unitNumber: string | null;
  prospectName: string;
  prospectPhone: string;
  prospectEmail: string | null;
  /** ISO timestamp of the requested visit. */
  preferredSlot: string;
  status: TourRequestStatus;
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  /** A pending or upcoming visit that no longer falls inside the property's visiting hours. */
  outsideVisitingHours?: boolean;
}

export interface TourRequestSummary {
  pending: number;
  upcoming: number;
}

export interface TourRequestPage {
  content: TourRequestResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export const TOUR_REQUESTS_PAGE_SIZE = 20;

export async function listTourRequests(
  propertyId: string,
  filter: TourRequestFilter,
  page: number,
  token: string
): Promise<TourRequestPage> {
  const params = new URLSearchParams({ filter, page: String(page), size: String(TOUR_REQUESTS_PAGE_SIZE) });
  return apiRequest<TourRequestPage>(`/api/v1/marketplace/properties/${propertyId}/tour-requests?${params.toString()}`, { token });
}

export async function getTourRequestSummary(propertyId: string, token: string): Promise<TourRequestSummary> {
  return apiRequest<TourRequestSummary>(`/api/v1/marketplace/properties/${propertyId}/tour-requests/summary`, { token });
}

export async function approveTourRequest(leadId: string, token: string): Promise<TourRequestResponse> {
  return apiRequest<TourRequestResponse>(`/api/v1/marketplace/tour-requests/${leadId}/approve`, { method: 'POST', token });
}

export async function rejectTourRequest(leadId: string, note: string | null, token: string): Promise<TourRequestResponse> {
  return apiRequest<TourRequestResponse>(`/api/v1/marketplace/tour-requests/${leadId}/reject`, {
    method: 'POST',
    token,
    body: JSON.stringify({ note: note && note.trim() ? note.trim() : null }),
  });
}
