import { TourSlot, TourSlots } from '@/types/tourSlot';

export type SlotPeriod = 'Morning' | 'Afternoon' | 'Evening';

const pad = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DD` in the visitor's local timezone. */
export function toLocalIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses `YYYY-MM-DD` as a local-time date (not UTC). */
export function parseLocalIsoDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Combines a `YYYY-MM-DD` date and `HH:mm` time in the visitor's local timezone. */
export function toLocalSlot(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

/** `16:00` → `4:00 PM`. */
export function formatSlotLabel(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function getSlotPeriod(time: string): SlotPeriod {
  const hour = Number(time.split(':')[0]);
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

/** A slot instant reduced to whole minutes, so slots from the server and the picker compare reliably. */
export function toSlotMinute(slot: string | Date): number {
  const ms = typeof slot === 'string' ? Date.parse(slot) : slot.getTime();
  return Math.floor(ms / 60_000);
}

/** The slot at `localTime` on `date`, whatever its status; null when the property doesn't offer it. */
export function findSlot(slots: TourSlots, date: string, localTime: string): TourSlot | null {
  if (!date || !localTime) return null;
  const day = slots.days.find((d) => d.date === date);
  return day?.slots.find((slot) => slot.localTime === localTime) ?? null;
}

/** The first bookable slot, preferring `preferredDate` and otherwise the soonest day that has one. */
export function findFirstBookableSlot(slots: TourSlots, preferredDate?: string): { date: string; slot: TourSlot } | null {
  const days = preferredDate
    ? [...slots.days.filter((d) => d.date === preferredDate), ...slots.days.filter((d) => d.date !== preferredDate)]
    : slots.days;
  for (const day of days) {
    const slot = day.slots.find((s) => s.status === 'AVAILABLE');
    if (slot) return { date: day.date, slot };
  }
  return null;
}

/** Whether the property's timezone is the visitor's own, so times need no explanation. */
export function isVisitorTimezone(timezone: string): boolean {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone === timezone;
  } catch {
    return true;
  }
}

/** `Asia/Kolkata` → `Asia/Kolkata (IST)` when the short name is known. */
export function formatTimezone(timezone: string, now: Date = new Date()): string {
  try {
    const short = new Intl.DateTimeFormat('en-IN', { timeZone: timezone, timeZoneName: 'short' })
      .formatToParts(now)
      .find((part) => part.type === 'timeZoneName')?.value;
    return short && short !== timezone ? `${timezone} · ${short}` : timezone;
  } catch {
    return timezone;
  }
}
