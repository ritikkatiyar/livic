import { apiRequest } from '@/src/api/client';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export const DAYS_OF_WEEK: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/** Times are `HH:mm` (the backend may also send `HH:mm:ss`). */
export interface TimeWindow {
  start: string;
  end: string;
}

export interface DayHours {
  dayOfWeek: DayOfWeek;
  windows: TimeWindow[];
}

export interface TourBlackout {
  id: string;
  /** `YYYY-MM-DD` in the property's timezone. */
  date: string;
  /** Both null when the whole day is blocked. */
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export interface TourAvailability {
  propertyId: string;
  /** False while the property still uses the default hours. */
  customized: boolean;
  timezone: string;
  slotMinutes: number;
  minNoticeMinutes: number;
  bookingWindowDays: number;
  /** Null means no limit. */
  maxVisitorsPerSlot: number | null;
  weeklyHours: DayHours[];
  blackouts: TourBlackout[];
}

export interface UpdateTourAvailabilityRequest {
  slotMinutes: number;
  minNoticeMinutes: number;
  bookingWindowDays: number;
  maxVisitorsPerSlot: number | null;
  timezone: string;
  weeklyHours: DayHours[];
}

export interface CreateBlackoutRequest {
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export type TourSlotStatus = 'AVAILABLE' | 'FULL' | 'DECLINED' | 'UNAVAILABLE';

export interface TourSlotDay {
  date: string;
  dayOfWeek: DayOfWeek;
  closed: boolean;
  slots: { start: string; localTime: string; status: TourSlotStatus }[];
}

export interface TourSlots {
  propertyId: string;
  timezone: string;
  slotMinutes: number;
  days: TourSlotDay[];
}

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
