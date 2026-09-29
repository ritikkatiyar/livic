import { DayMenu, DayOfWeek, DietType, MealSlot, MessMenu } from '../api/messMenu.api';

export const DAYS_OF_WEEK: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const DAY_LABELS: Record<DayOfWeek, { short: string; long: string }> = {
  MONDAY: { short: 'Mon', long: 'Monday' },
  TUESDAY: { short: 'Tue', long: 'Tuesday' },
  WEDNESDAY: { short: 'Wed', long: 'Wednesday' },
  THURSDAY: { short: 'Thu', long: 'Thursday' },
  FRIDAY: { short: 'Fri', long: 'Friday' },
  SATURDAY: { short: 'Sat', long: 'Saturday' },
  SUNDAY: { short: 'Sun', long: 'Sunday' },
};

export const DIET_LABELS: Record<DietType, string> = { VEG: 'Veg', EGG: 'Egg', NON_VEG: 'Non-veg' };

/** The device's current day; `Date.getDay()` counts from Sunday. */
export function todayDayOfWeek(now: Date = new Date()): DayOfWeek {
  return DAYS_OF_WEEK[(now.getDay() + 6) % 7];
}

/** `16:30` or `16:30:00` → `4:30 PM`. */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** `7:30 AM – 9:30 AM`, or null when the meal has no set time. */
export function formatSlotTime(slot: Pick<MealSlot, 'startTime' | 'endTime'>): string | null {
  return slot.startTime && slot.endTime ? `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}` : null;
}

export function dayMenu(menu: MessMenu, day: DayOfWeek): DayMenu | undefined {
  return menu.days.find((d) => d.dayOfWeek === day);
}

/** Each of the mess's meals on a day, in order, with that day's dishes (possibly none). */
export function mealsForDay(menu: MessMenu, day: DayOfWeek) {
  const meals = dayMenu(menu, day)?.meals ?? [];
  return menu.slots.map((slot) => ({
    slot,
    items: meals.find((meal) => meal.slotId === slot.id)?.items ?? [],
  }));
}
