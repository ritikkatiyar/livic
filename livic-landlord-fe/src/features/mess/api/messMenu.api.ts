import { apiRequest } from '@/src/api/client';
import { DayOfWeek, toHHmm } from '@/src/utils/weekdays';

export type DietType = 'VEG' | 'NON_VEG' | 'EGG';

/** A meal the property serves, such as Breakfast or Bed tea. Times are `HH:mm`; both are set or both null. */
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

export interface Meal {
  slotId: string;
  items: MenuItem[];
}

export interface DayMenu {
  dayOfWeek: DayOfWeek;
  note: string | null;
  /** One per slot, in slot order. */
  meals: Meal[];
}

export interface MessMenu {
  propertyId: string;
  /** Whether residents can see the menu. */
  enabled: boolean;
  slots: MealSlot[];
  /** All seven days, Monday first. */
  days: DayMenu[];
}

export interface MealSlotRequest {
  /** Null for a new slot; saved slots left out of the list are deleted with their dishes. */
  id: string | null;
  name: string;
  startTime: string | null;
  endTime: string | null;
}

export interface UpdateWeekMenuRequest {
  days: {
    dayOfWeek: DayOfWeek;
    note: string | null;
    meals: { slotId: string; items: { name: string; dietType: DietType | null }[] }[];
  }[];
}

const base = (propertyId: string) => `/api/v1/mess/properties/${propertyId}`;

/** The backend sends times as `HH:mm:ss`. */
function normalize(menu: MessMenu): MessMenu {
  return {
    ...menu,
    slots: menu.slots.map((slot) => ({
      ...slot,
      startTime: slot.startTime ? toHHmm(slot.startTime) : null,
      endTime: slot.endTime ? toHHmm(slot.endTime) : null,
    })),
  };
}

export async function getMessMenu(propertyId: string, token: string): Promise<MessMenu> {
  return normalize(await apiRequest<MessMenu>(`${base(propertyId)}/menu`, { token }));
}

export async function updateMessSettings(propertyId: string, enabled: boolean, token: string): Promise<MessMenu> {
  return normalize(await apiRequest<MessMenu>(`${base(propertyId)}/settings`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ enabled }),
  }));
}

export async function updateMealSlots(propertyId: string, slots: MealSlotRequest[], token: string): Promise<MessMenu> {
  return normalize(await apiRequest<MessMenu>(`${base(propertyId)}/slots`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ slots }),
  }));
}

export async function updateWeekMenu(propertyId: string, request: UpdateWeekMenuRequest, token: string): Promise<MessMenu> {
  return normalize(await apiRequest<MessMenu>(`${base(propertyId)}/week`, {
    method: 'PUT',
    token,
    body: JSON.stringify(request),
  }));
}
