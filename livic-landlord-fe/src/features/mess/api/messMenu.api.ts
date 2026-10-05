import { apiRequest } from '@/src/api/client';
import type { ApiInput, ApiModel } from '@/src/api/models';
import { toHHmm } from '@/src/utils/weekdays';

/** A meal the property serves, such as Breakfast or Bed tea. Times are `HH:mm`; both are set or both null. */
export type MealSlot = ApiModel<'MealSlotResponse', never, 'startTime' | 'endTime'>;

/** `dietType` is null when the dish is not marked. */
export type MenuItem = ApiModel<'MenuItemResponse', never, 'dietType'>;

export type DietType = NonNullable<MenuItem['dietType']>;

export type Meal = Omit<ApiModel<'MealResponse'>, 'items'> & { items: MenuItem[] };

/** `meals` holds one entry per slot, in slot order. */
export type DayMenu = Omit<ApiModel<'DayMenuResponse', never, 'note'>, 'meals'> & { meals: Meal[] };

/** `enabled` is whether residents can see the menu; `days` holds all seven, Monday first. */
export type MessMenu = Omit<ApiModel<'MessMenuResponse'>, 'slots' | 'days'> & {
  slots: MealSlot[];
  days: DayMenu[];
};

/** `id` is null for a new slot; saved slots left out of the list are deleted with their dishes. */
export type MealSlotRequest = ApiInput<'MealSlotRequest'>;

export type UpdateWeekMenuRequest = ApiInput<'UpdateWeekMenuRequest'>;

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
