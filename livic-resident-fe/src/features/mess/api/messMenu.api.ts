import { apiRequest } from '@/src/api/client';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export type DietType = 'VEG' | 'NON_VEG' | 'EGG';

/** A meal the mess serves. Times are `HH:mm[:ss]`; both are set or both null. */
export interface MealSlot {
  id: string;
  name: string;
  startTime: string | null;
  endTime: string | null;
}

export interface MenuItem {
  id: string;
  name: string;
  /** Null when the dish is not marked. */
  dietType: DietType | null;
}

export interface DayMenu {
  dayOfWeek: DayOfWeek;
  note: string | null;
  /** One per slot, in slot order. */
  meals: { slotId: string; items: MenuItem[] }[];
}

export interface MessMenu {
  propertyId: string | null;
  /** False when none of the resident's homes shows a mess menu; slots and days are then empty. */
  enabled: boolean;
  slots: MealSlot[];
  /** All seven days, Monday first. */
  days: DayMenu[];
}

/** The weekly menu where the signed-in resident lives. */
export async function getMyMessMenu(token: string): Promise<MessMenu> {
  return apiRequest<MessMenu>('/api/v1/mess/my-menu', { token });
}
