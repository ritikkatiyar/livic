import { TourSlots } from '@/types/tourSlot';
import {
  findFirstBookableSlot,
  findSlot,
  formatSlotLabel,
  formatTimezone,
  getSlotPeriod,
  isVisitorTimezone,
  toLocalIsoDate,
  toLocalSlot,
  toSlotMinute,
} from '@/utils/visitSlots';

const slots: TourSlots = {
  propertyId: 'prop-1',
  timezone: 'Asia/Kolkata',
  slotMinutes: 60,
  days: [
    {
      date: '2026-09-14',
      closed: false,
      slots: [
        { start: '2026-09-14T03:30:00Z', localTime: '09:00', status: 'UNAVAILABLE' },
        { start: '2026-09-14T04:30:00Z', localTime: '10:00', status: 'FULL' },
      ],
    },
    { date: '2026-09-15', closed: true, slots: [] },
    {
      date: '2026-09-16',
      closed: false,
      slots: [
        { start: '2026-09-16T04:30:00Z', localTime: '10:00', status: 'DECLINED' },
        { start: '2026-09-16T05:30:00Z', localTime: '11:00', status: 'AVAILABLE' },
        { start: '2026-09-16T06:30:00Z', localTime: '12:00', status: 'AVAILABLE' },
      ],
    },
  ],
};

describe('visitSlots', () => {
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

  it('finds a slot by date and time, whatever its status', () => {
    expect(findSlot(slots, '2026-09-14', '10:00')?.status).toBe('FULL');
    expect(findSlot(slots, '2026-09-16', '11:00')?.start).toBe('2026-09-16T05:30:00Z');
    expect(findSlot(slots, '2026-09-16', '13:00')).toBeNull();
    expect(findSlot(slots, '2026-09-15', '11:00')).toBeNull();
    expect(findSlot(slots, '', '')).toBeNull();
  });

  it('picks the first bookable slot, preferring a given date', () => {
    expect(findFirstBookableSlot(slots)).toMatchObject({ date: '2026-09-16', slot: { localTime: '11:00' } });
    // A day with nothing bookable falls through to the next day that has something
    expect(findFirstBookableSlot(slots, '2026-09-14')).toMatchObject({ date: '2026-09-16', slot: { localTime: '11:00' } });
    expect(findFirstBookableSlot({ ...slots, days: [slots.days[0], slots.days[1]] })).toBeNull();
  });

  it('compares slot instants by the minute', () => {
    expect(toSlotMinute('2026-09-16T05:30:20Z')).toBe(toSlotMinute('2026-09-16T05:30:00Z'));
    expect(toSlotMinute(new Date('2026-09-16T05:31:00Z'))).not.toBe(toSlotMinute('2026-09-16T05:30:00Z'));
  });

  it('only calls a timezone the visitor"s when it matches their own', () => {
    const visitorZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(isVisitorTimezone(visitorZone)).toBe(true);
    expect(isVisitorTimezone(visitorZone === 'Asia/Kolkata' ? 'America/New_York' : 'Asia/Kolkata')).toBe(false);
  });

  it('labels a timezone with its short name when there is one', () => {
    expect(formatTimezone('Asia/Kolkata', new Date('2026-09-16T05:30:00Z'))).toContain('Asia/Kolkata');
    expect(formatTimezone('Not/AZone')).toBe('Not/AZone');
  });

  it('builds local dates and slot instants', () => {
    expect(toLocalIsoDate(new Date(2026, 8, 30 + 1))).toBe('2026-10-01');
    expect(toLocalSlot('2026-09-16', '11:00').getHours()).toBe(11);
  });
});
