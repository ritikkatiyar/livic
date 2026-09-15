/** Visit slots offered to prospects (local time, 24h). */
export const TOUR_TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

/** How many days ahead a visit can be booked. */
export const TOUR_BOOKING_WINDOW_DAYS = 14;

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

/** The `HH:mm` picker slots on `date` that match one of the `blockedSlots` instants (ISO strings). */
export function getBlockedSlots(date: string, blockedSlots: readonly string[]): string[] {
  if (blockedSlots.length === 0) return [];
  const blocked = new Set(blockedSlots.map(toSlotMinute));
  return TOUR_TIME_SLOTS.filter((slot) => blocked.has(toSlotMinute(toLocalSlot(date, slot))));
}

/** Slots on `date` that are still in the future relative to `now` and not blocked (e.g. declined by the landlord). */
export function getAvailableSlots(date: string, now: Date, blockedSlots: readonly string[] = []): string[] {
  const blocked = getBlockedSlots(date, blockedSlots);
  return TOUR_TIME_SLOTS.filter((slot) => toLocalSlot(date, slot) > now && !blocked.includes(slot));
}

/** Bookable visit dates starting today; today is skipped once all of its slots have passed. */
export function getVisitDates(now: Date, days: number = TOUR_BOOKING_WINDOW_DAYS): string[] {
  const dates: string[] = [];
  for (let offset = 0; dates.length < days; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const iso = toLocalIsoDate(d);
    if (offset > 0 || getAvailableSlots(iso, now).length > 0) {
      dates.push(iso);
    }
  }
  return dates;
}
