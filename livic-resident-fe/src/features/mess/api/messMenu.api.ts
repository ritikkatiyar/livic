import { apiRequest } from '@/src/api/client';
import type { ApiModel } from '@/src/api/models';

/** A meal the mess serves. Times are `HH:mm[:ss]`; both are set or both null. */
export type MealSlot = ApiModel<'MealSlotResponse', never, 'startTime' | 'endTime'>;

/** `dietType` is null when the dish is not marked. */
export type MenuItem = ApiModel<'MenuItemResponse', never, 'dietType'>;

export type DietType = NonNullable<MenuItem['dietType']>;

/** `meals` holds one entry per slot, in slot order. */
export type DayMenu = Omit<ApiModel<'DayMenuResponse', never, 'note'>, 'meals'> & {
  meals: (Omit<ApiModel<'MealResponse'>, 'items'> & { items: MenuItem[] })[];
};

export type DayOfWeek = DayMenu['dayOfWeek'];

/**
 * `enabled` is false when none of the resident's homes shows a mess menu; `propertyId` is then null
 * and slots and days are empty. Otherwise `days` holds all seven, Monday first.
 */
export type MessMenu = Omit<ApiModel<'MessMenuResponse', never, 'propertyId'>, 'slots' | 'days'> & {
  slots: MealSlot[];
  days: DayMenu[];
};

/** The weekly menu where the signed-in resident lives. */
export async function getMyMessMenu(token: string): Promise<MessMenu> {
  return apiRequest<MessMenu>('/api/v1/me/mess-menu', { token });
}
