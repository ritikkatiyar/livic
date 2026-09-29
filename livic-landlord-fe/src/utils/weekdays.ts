/** Days of the week and times of day as the backend sends them (`java.time.DayOfWeek`, `HH:mm[:ss]`). */

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

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

/** The device's current day; `Date.getDay()` counts from Sunday. */
export function todayDayOfWeek(now: Date = new Date()): DayOfWeek {
  return DAYS_OF_WEEK[(now.getDay() + 6) % 7];
}

/** `10:00:00` → `10:00`. */
export function toHHmm(time: string): string {
  return time.length >= 5 ? time.slice(0, 5) : time;
}

export function toMinutes(time: string): number {
  const [h, m] = toHHmm(time).split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** `16:30` → `4:30 PM`. */
export function formatTime(time: string): string {
  const minutes = toMinutes(time);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** Every `stepMinutes` from 00:00 to the last step before midnight, labelled like `4:30 PM`. */
export function timeOptions(stepMinutes: number): { label: string; value: string }[] {
  return Array.from({ length: (24 * 60) / stepMinutes }, (_, i) => {
    const value = fromMinutes(i * stepMinutes);
    return { label: formatTime(value), value };
  });
}
