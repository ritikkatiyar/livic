import {
  formatSlotLabel,
  getAvailableSlots,
  getSlotPeriod,
  getVisitDates,
  toLocalIsoDate,
  TOUR_TIME_SLOTS,
} from '@/utils/visitSlots';

describe('visitSlots', () => {
  const afternoon = new Date(2026, 8, 14, 15, 30); // 14 Sep 2026, 3:30 PM local

  it('formats slot labels in 12-hour time', () => {
    expect(formatSlotLabel('09:00')).toBe('9:00 AM');
    expect(formatSlotLabel('12:00')).toBe('12:00 PM');
    expect(formatSlotLabel('19:00')).toBe('7:00 PM');
  });

  it('groups slots into periods of the day', () => {
    expect(getSlotPeriod('11:00')).toBe('Morning');
    expect(getSlotPeriod('12:00')).toBe('Afternoon');
    expect(getSlotPeriod('16:00')).toBe('Afternoon');
    expect(getSlotPeriod('17:00')).toBe('Evening');
  });

  it('only offers future slots', () => {
    expect(getAvailableSlots('2026-09-14', afternoon)).toEqual(['16:00', '17:00', '18:00', '19:00']);
    expect(getAvailableSlots('2026-09-15', afternoon)).toEqual(TOUR_TIME_SLOTS);
  });

  it('builds a 14-day window starting today', () => {
    const dates = getVisitDates(afternoon);
    expect(dates).toHaveLength(14);
    expect(dates[0]).toBe('2026-09-14');
    expect(dates[13]).toBe('2026-09-27');
  });

  it('starts tomorrow once every slot today has passed', () => {
    const dates = getVisitDates(new Date(2026, 8, 14, 19, 30));
    expect(dates).toHaveLength(14);
    expect(dates[0]).toBe('2026-09-15');
  });

  it('formats local ISO dates across month boundaries', () => {
    expect(toLocalIsoDate(new Date(2026, 8, 30 + 1))).toBe('2026-10-01');
  });
});
