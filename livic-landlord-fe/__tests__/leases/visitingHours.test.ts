import { DAYS_OF_WEEK, DayOfWeek, TimeWindow, TourAvailability } from '../../src/features/leases/api/tourAvailability.api';
import {
  copyMondayToWeekdays,
  countSlots,
  formatTime,
  isDraftEqual,
  nextWindow,
  summarizeWeeklyHours,
  TIME_OPTIONS,
  toDraft,
  toUpdateRequest,
  upcomingDates,
  validateDraft,
  VisitingHoursDraft,
} from '../../src/features/leases/utils/visitingHours';

function hours(overrides: Partial<Record<DayOfWeek, TimeWindow[]>> = {}): Record<DayOfWeek, TimeWindow[]> {
  const base = Object.fromEntries(DAYS_OF_WEEK.map((d) => [d, [] as TimeWindow[]])) as Record<DayOfWeek, TimeWindow[]>;
  return { ...base, ...overrides };
}

function draft(overrides: Partial<VisitingHoursDraft> = {}): VisitingHoursDraft {
  return {
    slotMinutes: 60,
    minNoticeMinutes: 60,
    bookingWindowDays: 14,
    maxVisitorsPerSlot: null,
    timezone: 'Asia/Kolkata',
    weeklyHours: hours({ MONDAY: [{ start: '10:00', end: '13:00' }] }),
    ...overrides,
  };
}

describe('visiting hours helpers', () => {
  it('formats times in 12-hour form and offers every half hour', () => {
    expect(formatTime('09:00')).toBe('9:00 AM');
    expect(formatTime('12:30')).toBe('12:30 PM');
    expect(formatTime('19:00:00')).toBe('7:00 PM');
    expect(TIME_OPTIONS).toHaveLength(48);
    expect(TIME_OPTIONS[0]).toEqual({ label: '12:00 AM', value: '00:00' });
    expect(TIME_OPTIONS[47]).toEqual({ label: '11:30 PM', value: '23:30' });
  });

  it('turns the API response into an editable draft with every day present', () => {
    const availability: TourAvailability = {
      propertyId: 'prop-1',
      customized: true,
      timezone: 'Asia/Kolkata',
      slotMinutes: 30,
      minNoticeMinutes: 180,
      bookingWindowDays: 7,
      maxVisitorsPerSlot: 2,
      weeklyHours: [{ dayOfWeek: 'MONDAY', windows: [{ start: '10:00:00', end: '13:00:00' }] }],
      blackouts: [],
    };

    const result = toDraft(availability);

    expect(result.weeklyHours.MONDAY).toEqual([{ start: '10:00', end: '13:00' }]);
    expect(result.weeklyHours.SUNDAY).toEqual([]);
    expect(result.maxVisitorsPerSlot).toBe(2);
  });

  it('sends every day, with each day"s windows in order', () => {
    const request = toUpdateRequest(draft({
      weeklyHours: hours({ MONDAY: [{ start: '16:00', end: '19:00' }, { start: '10:00', end: '13:00' }] }),
    }));

    expect(request.weeklyHours).toHaveLength(7);
    expect(request.weeklyHours[0]).toEqual({
      dayOfWeek: 'MONDAY',
      windows: [{ start: '10:00', end: '13:00' }, { start: '16:00', end: '19:00' }],
    });
  });

  it('treats reordered windows as the same settings', () => {
    const a = draft({ weeklyHours: hours({ MONDAY: [{ start: '10:00', end: '13:00' }, { start: '16:00', end: '19:00' }] }) });
    const b = draft({ weeklyHours: hours({ MONDAY: [{ start: '16:00', end: '19:00' }, { start: '10:00', end: '13:00' }] }) });

    expect(isDraftEqual(a, b)).toBe(true);
    expect(isDraftEqual(a, draft({ ...a, slotMinutes: 30 }))).toBe(false);
  });

  it('rejects the day layouts the backend would refuse', () => {
    expect(validateDraft(draft())).toEqual({});
    expect(validateDraft(draft({ weeklyHours: hours({ TUESDAY: [{ start: '13:00', end: '10:00' }] }) })).TUESDAY)
      .toBe('End time must be after the start time');
    expect(validateDraft(draft({ weeklyHours: hours({ TUESDAY: [{ start: '10:00', end: '10:30' }] }) })).TUESDAY)
      .toBe('Each time range must be at least 60 minutes');
    expect(validateDraft(draft({
      weeklyHours: hours({ TUESDAY: [{ start: '10:00', end: '12:00' }, { start: '11:00', end: '13:00' }] }),
    })).TUESDAY).toBe('Time ranges overlap');
    // 30-minute slots make a 30-minute range valid
    expect(validateDraft(draft({ slotMinutes: 30, weeklyHours: hours({ TUESDAY: [{ start: '10:00', end: '10:30' }] }) }))).toEqual({});
  });

  it('copies Monday to the other weekdays only', () => {
    const copied = copyMondayToWeekdays(draft({
      weeklyHours: hours({ MONDAY: [{ start: '10:00', end: '13:00' }], SATURDAY: [{ start: '11:00', end: '14:00' }] }),
    }));

    expect(copied.weeklyHours.FRIDAY).toEqual([{ start: '10:00', end: '13:00' }]);
    expect(copied.weeklyHours.SATURDAY).toEqual([{ start: '11:00', end: '14:00' }]);
    expect(copied.weeklyHours.SUNDAY).toEqual([]);
  });

  it('counts the slots a day produces and suggests the next range', () => {
    expect(countSlots([{ start: '10:00', end: '13:00' }], 60)).toBe(3);
    expect(countSlots([{ start: '10:00', end: '13:00' }], 30)).toBe(6);
    // A range that does not divide evenly only counts whole slots
    expect(countSlots([{ start: '10:00', end: '11:30' }], 60)).toBe(1);

    expect(nextWindow([], 60)).toEqual({ start: '10:00', end: '13:00' });
    expect(nextWindow([{ start: '10:00', end: '13:00' }], 60)).toEqual({ start: '14:00', end: '16:00' });
  });

  it('summarises the week, grouping days that share hours', () => {
    expect(summarizeWeeklyHours(hours({
      MONDAY: [{ start: '10:00', end: '13:00' }, { start: '16:00', end: '19:00' }],
      TUESDAY: [{ start: '10:00', end: '13:00' }, { start: '16:00', end: '19:00' }],
      WEDNESDAY: [{ start: '10:00', end: '13:00' }, { start: '16:00', end: '19:00' }],
      THURSDAY: [{ start: '10:00', end: '13:00' }, { start: '16:00', end: '19:00' }],
      FRIDAY: [{ start: '10:00', end: '13:00' }, { start: '16:00', end: '19:00' }],
      SATURDAY: [{ start: '10:00', end: '14:00' }],
    }))).toBe('Mon–Fri 10:00 AM–1:00 PM, 4:00 PM–7:00 PM · Sat 10:00 AM–2:00 PM · Sun closed');

    const everyDay = Object.fromEntries(DAYS_OF_WEEK.map((d) => [d, [{ start: '09:00', end: '20:00' }]])) as Record<DayOfWeek, TimeWindow[]>;
    expect(summarizeWeeklyHours(everyDay)).toBe('Every day 9:00 AM–8:00 PM');
    expect(summarizeWeeklyHours(hours())).toBe('Closed every day');
  });

  it('lists upcoming dates starting today', () => {
    const dates = upcomingDates(3, new Date(2026, 8, 30, 22, 0));

    expect(dates).toEqual(['2026-09-30', '2026-10-01', '2026-10-02']);
  });
});
