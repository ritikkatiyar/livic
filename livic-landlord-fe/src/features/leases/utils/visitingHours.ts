import { DAYS_OF_WEEK, DayHours, DayOfWeek, TimeWindow, TourAvailability, UpdateTourAvailabilityRequest } from '../api/tourAvailability.api';

/** Times are picked on the half hour so both 30- and 60-minute slots line up. */
const TIME_STEP_MINUTES = 30;
export const MAX_WINDOWS_PER_DAY = 6;

export const SLOT_LENGTH_OPTIONS = [30, 60] as const;
export const BOOKING_WINDOW_OPTIONS = [7, 14, 30] as const;
export const MIN_NOTICE_OPTIONS: { label: string; value: number }[] = [
  { label: 'No minimum', value: 0 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
  { label: '6 hours', value: 360 },
  { label: '12 hours', value: 720 },
  { label: '1 day', value: 1440 },
  { label: '2 days', value: 2880 },
];
export const MAX_VISITORS_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'No limit', value: null },
  ...[1, 2, 3, 4, 5, 10].map((n) => ({ label: n === 1 ? '1 visitor' : `${n} visitors`, value: n })),
];

export const DAY_LABELS: Record<DayOfWeek, { short: string; long: string }> = {
  MONDAY: { short: 'Mon', long: 'Monday' },
  TUESDAY: { short: 'Tue', long: 'Tuesday' },
  WEDNESDAY: { short: 'Wed', long: 'Wednesday' },
  THURSDAY: { short: 'Thu', long: 'Thursday' },
  FRIDAY: { short: 'Fri', long: 'Friday' },
  SATURDAY: { short: 'Sat', long: 'Saturday' },
  SUNDAY: { short: 'Sun', long: 'Sunday' },
};

const WEEKDAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

/** Editable copy of the settings: every day present, times as `HH:mm`. */
export interface VisitingHoursDraft {
  slotMinutes: number;
  minNoticeMinutes: number;
  bookingWindowDays: number;
  maxVisitorsPerSlot: number | null;
  timezone: string;
  weeklyHours: Record<DayOfWeek, TimeWindow[]>;
}

/** `10:00:00` → `10:00`. */
export function toHHmm(time: string): string {
  return time.length >= 5 ? time.slice(0, 5) : time;
}

export function toMinutes(time: string): number {
  const [h, m] = toHHmm(time).split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** `16:30` → `4:30 PM`. */
export function formatTime(time: string): string {
  const minutes = toMinutes(time);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** Every half hour from 00:00 to 23:30. */
export const TIME_OPTIONS: { label: string; value: string }[] = Array.from({ length: (24 * 60) / TIME_STEP_MINUTES }, (_, i) => {
  const value = fromMinutes(i * TIME_STEP_MINUTES);
  return { label: formatTime(value), value };
});

export function toDraft(availability: TourAvailability): VisitingHoursDraft {
  const weeklyHours = Object.fromEntries(DAYS_OF_WEEK.map((day) => [day, [] as TimeWindow[]])) as Record<DayOfWeek, TimeWindow[]>;
  availability.weeklyHours.forEach((day) => {
    weeklyHours[day.dayOfWeek] = day.windows.map((w) => ({ start: toHHmm(w.start), end: toHHmm(w.end) }));
  });
  return {
    slotMinutes: availability.slotMinutes,
    minNoticeMinutes: availability.minNoticeMinutes,
    bookingWindowDays: availability.bookingWindowDays,
    maxVisitorsPerSlot: availability.maxVisitorsPerSlot,
    timezone: availability.timezone,
    weeklyHours,
  };
}

export function toUpdateRequest(draft: VisitingHoursDraft): UpdateTourAvailabilityRequest {
  const weeklyHours: DayHours[] = DAYS_OF_WEEK.map((day) => ({
    dayOfWeek: day,
    windows: [...draft.weeklyHours[day]].sort((a, b) => toMinutes(a.start) - toMinutes(b.start)),
  }));
  return {
    slotMinutes: draft.slotMinutes,
    minNoticeMinutes: draft.minNoticeMinutes,
    bookingWindowDays: draft.bookingWindowDays,
    maxVisitorsPerSlot: draft.maxVisitorsPerSlot,
    timezone: draft.timezone,
    weeklyHours,
  };
}

export function isDraftEqual(a: VisitingHoursDraft, b: VisitingHoursDraft): boolean {
  return JSON.stringify(toUpdateRequest(a)) === JSON.stringify(toUpdateRequest(b));
}

/** A new window after the day's last one (or 10 AM–1 PM for a day being opened). */
export function nextWindow(windows: TimeWindow[], slotMinutes: number): TimeWindow {
  if (windows.length === 0) return { start: '10:00', end: '13:00' };
  const lastEnd = Math.max(...windows.map((w) => toMinutes(w.end)));
  const start = Math.min(lastEnd + 60, 24 * 60 - slotMinutes - TIME_STEP_MINUTES);
  return { start: fromMinutes(start), end: fromMinutes(Math.min(start + 120, 24 * 60 - TIME_STEP_MINUTES)) };
}

/** Per-day problems that the backend would reject; an empty object means the draft can be saved. */
export function validateDraft(draft: VisitingHoursDraft): Partial<Record<DayOfWeek, string>> {
  const errors: Partial<Record<DayOfWeek, string>> = {};
  DAYS_OF_WEEK.forEach((day) => {
    const windows = [...draft.weeklyHours[day]].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    for (let i = 0; i < windows.length; i++) {
      const start = toMinutes(windows[i].start);
      const end = toMinutes(windows[i].end);
      if (end <= start) {
        errors[day] = 'End time must be after the start time';
        return;
      }
      if (end - start < draft.slotMinutes) {
        errors[day] = `Each time range must be at least ${draft.slotMinutes} minutes`;
        return;
      }
      if (i > 0 && start < toMinutes(windows[i - 1].end)) {
        errors[day] = 'Time ranges overlap';
        return;
      }
    }
  });
  return errors;
}

/** Copies Monday's hours to Tuesday–Friday. */
export function copyMondayToWeekdays(draft: VisitingHoursDraft): VisitingHoursDraft {
  const monday = draft.weeklyHours.MONDAY;
  const weeklyHours = { ...draft.weeklyHours };
  WEEKDAYS.slice(1).forEach((day) => {
    weeklyHours[day] = monday.map((w) => ({ ...w }));
  });
  return { ...draft, weeklyHours };
}

/** Number of visit slots a day's windows produce. */
export function countSlots(windows: TimeWindow[], slotMinutes: number): number {
  return windows.reduce((total, w) => total + Math.max(0, Math.floor((toMinutes(w.end) - toMinutes(w.start)) / slotMinutes)), 0);
}

function formatRange(w: TimeWindow): string {
  return `${formatTime(w.start)}–${formatTime(w.end)}`;
}

/**
 * One-line summary, grouping consecutive days with the same hours:
 * "Mon–Fri 10:00 AM–1:00 PM, 4:00 PM–7:00 PM · Sat 10:00 AM–2:00 PM · Sun closed".
 */
export function summarizeWeeklyHours(weeklyHours: Record<DayOfWeek, TimeWindow[]>): string {
  const key = (day: DayOfWeek) => weeklyHours[day].map(formatRange).join(', ');
  if (DAYS_OF_WEEK.every((day) => key(day) === key('MONDAY'))) {
    return key('MONDAY') ? `Every day ${key('MONDAY')}` : 'Closed every day';
  }

  const groups: { from: DayOfWeek; to: DayOfWeek; hours: string }[] = [];
  DAYS_OF_WEEK.forEach((day) => {
    const last = groups[groups.length - 1];
    if (last && last.hours === key(day)) {
      last.to = day;
    } else {
      groups.push({ from: day, to: day, hours: key(day) });
    }
  });
  return groups
    .map((g) => {
      const days = g.from === g.to ? DAY_LABELS[g.from].short : `${DAY_LABELS[g.from].short}–${DAY_LABELS[g.to].short}`;
      return `${days} ${g.hours || 'closed'}`;
    })
    .join(' · ');
}

export function formatNotice(minutes: number): string {
  return MIN_NOTICE_OPTIONS.find((o) => o.value === minutes)?.label ?? `${minutes} minutes`;
}

/** `YYYY-MM-DD` for a local date. */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** The next `days` calendar dates starting today, for picking a date to block. */
export function upcomingDates(days: number, now: Date = new Date()): string[] {
  return Array.from({ length: days }, (_, i) => toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)));
}

/** `2026-09-16` → `Wed, 16 Sep`. */
export function formatIsoDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}
