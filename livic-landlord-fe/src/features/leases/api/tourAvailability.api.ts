import { apiRequest } from '@/src/api/client';
import type { ApiInput, ApiModel } from '@/src/api/models';

/** Times are `HH:mm` (the backend may also send `HH:mm:ss`). */
export type TimeWindow = ApiModel<'TimeWindow'>;

export type DayHours = ApiModel<'DayHours'>;

/** `date` is `YYYY-MM-DD` in the property's timezone; both times are null when the whole day is blocked. */
export type TourBlackout = ApiModel<'BlackoutResponse', never, 'startTime' | 'endTime' | 'reason'>;

/** `maxVisitorsPerSlot` null means no limit. */
export type TourAvailability = Omit<ApiModel<'TourAvailabilityResponse', never, 'maxVisitorsPerSlot'>, 'blackouts'> & {
  blackouts: TourBlackout[];
};

export type UpdateTourAvailabilityRequest = ApiInput<'UpdateTourAvailabilityRequest'>;

export type CreateBlackoutRequest = ApiInput<'CreateBlackoutRequest'>;

export type TourSlotStatus = 'AVAILABLE' | 'FULL' | 'DECLINED' | 'UNAVAILABLE';

export type TourSlotDay = ApiModel<'TourSlotDay'>;

export type TourSlots = ApiModel<'TourSlotsResponse'>;

export async function getTourAvailability(propertyId: string, token: string): Promise<TourAvailability> {
  return apiRequest<TourAvailability>(`/api/v1/marketplace/properties/${propertyId}/tour-availability`, { token });
}

export async function updateTourAvailability(
  propertyId: string,
  request: UpdateTourAvailabilityRequest,
  token: string
): Promise<TourAvailability> {
  return apiRequest<TourAvailability>(`/api/v1/marketplace/properties/${propertyId}/tour-availability`, {
    method: 'PUT',
    token,
    body: JSON.stringify(request),
  });
}

export async function addTourBlackout(propertyId: string, request: CreateBlackoutRequest, token: string): Promise<TourBlackout> {
  return apiRequest<TourBlackout>(`/api/v1/marketplace/properties/${propertyId}/tour-blackouts`, {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  });
}

export async function deleteTourBlackout(blackoutId: string, token: string): Promise<void> {
  await apiRequest<void>(`/api/v1/marketplace/tour-blackouts/${blackoutId}`, { method: 'DELETE', token });
}

/** The slots visitors currently see on the marketplace (public endpoint). */
export async function getTourSlotsPreview(propertyId: string): Promise<TourSlots> {
  return apiRequest<TourSlots>(`/api/v1/marketplace/properties/${propertyId}/tour-slots`);
}
