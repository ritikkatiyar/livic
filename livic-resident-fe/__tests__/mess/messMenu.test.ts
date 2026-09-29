import { MessMenu } from '../../src/features/mess/api/messMenu.api';
import { DAYS_OF_WEEK, formatSlotTime, formatTime, mealsForDay, todayDayOfWeek } from '../../src/features/mess/utils/messMenu';

const menu: MessMenu = {
  propertyId: 'prop-1',
  enabled: true,
  slots: [
    { id: 'breakfast', name: 'Breakfast', startTime: '07:30:00', endTime: '09:30:00' },
    { id: 'dinner', name: 'Dinner', startTime: null, endTime: null },
  ],
  days: DAYS_OF_WEEK.map((dayOfWeek) => ({
    dayOfWeek,
    note: null,
    meals: dayOfWeek === 'SUNDAY' ? [{ slotId: 'dinner', items: [{ id: 'i1', name: 'Biryani', dietType: 'NON_VEG' as const }] }] : [],
  })),
};

describe('resident mess menu utils', () => {
  it('maps JavaScript days, which start on Sunday, to backend days', () => {
    expect(todayDayOfWeek(new Date(2026, 8, 27))).toBe('SUNDAY');
    expect(todayDayOfWeek(new Date(2026, 8, 29))).toBe('TUESDAY');
  });

  it('formats times sent with or without seconds', () => {
    expect(formatTime('07:30:00')).toBe('7:30 AM');
    expect(formatTime('20:00')).toBe('8:00 PM');
    expect(formatTime('00:15')).toBe('12:15 AM');
    expect(formatSlotTime(menu.slots[0])).toBe('7:30 AM – 9:30 AM');
    expect(formatSlotTime(menu.slots[1])).toBeNull();
  });

  it("lists every meal for a day, in order, even the ones with nothing on them", () => {
    const sunday = mealsForDay(menu, 'SUNDAY');

    expect(sunday.map((meal) => meal.slot.name)).toEqual(['Breakfast', 'Dinner']);
    expect(sunday[0].items).toEqual([]);
    expect(sunday[1].items.map((item) => item.name)).toEqual(['Biryani']);
  });
});
