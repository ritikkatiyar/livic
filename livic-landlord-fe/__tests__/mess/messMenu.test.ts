import { MessMenu } from '../../src/features/mess/api/messMenu.api';
import {
  copyDay,
  formatSlotTime,
  isDraftEqual,
  SlotDraft,
  toDraft,
  toSlotRequests,
  toWeekRequest,
  validateDraft,
  validateSlots,
} from '../../src/features/mess/utils/messMenu';
import { DAYS_OF_WEEK, todayDayOfWeek } from '../../src/utils/weekdays';

const slots = [
  { id: 'breakfast', name: 'Breakfast', startTime: '07:30', endTime: '09:30' },
  { id: 'dinner', name: 'Dinner', startTime: null, endTime: null },
];

const menu: MessMenu = {
  propertyId: 'prop-1',
  enabled: true,
  slots,
  days: DAYS_OF_WEEK.map((dayOfWeek) => ({
    dayOfWeek,
    note: dayOfWeek === 'SUNDAY' ? 'Sunday special' : null,
    meals: [
      { slotId: 'breakfast', items: dayOfWeek === 'MONDAY' ? [{ id: 'i1', name: 'Poha', dietType: 'VEG' as const }] : [] },
      { slotId: 'dinner', items: [] },
    ],
  })),
};

function slotRow(patch: Partial<SlotDraft>): SlotDraft {
  return { key: Math.random().toString(), id: null, name: 'Lunch', startTime: '', endTime: '', ...patch };
}

describe('mess menu draft', () => {
  it('round-trips the saved week, leaving out empty meals and blank notes', () => {
    const request = toWeekRequest(toDraft(menu), slots);

    expect(request.days).toHaveLength(7);
    expect(request.days[0]).toEqual({
      dayOfWeek: 'MONDAY',
      note: null,
      meals: [{ slotId: 'breakfast', items: [{ name: 'Poha', dietType: 'VEG' }] }],
    });
    expect(request.days[6]).toEqual({ dayOfWeek: 'SUNDAY', note: 'Sunday special', meals: [] });
    expect(isDraftEqual(toDraft(menu), toDraft(menu), slots)).toBe(true);
  });

  it('drops dishes under a meal that has since been deleted', () => {
    const request = toWeekRequest(toDraft(menu), [slots[1]]);

    expect(request.days[0].meals).toEqual([]);
  });

  it('trims names and notes before saving', () => {
    const draft = toDraft(menu);
    draft.MONDAY = { note: '  Fresh fruit  ', items: { breakfast: [{ key: 'k', name: ' Idli ', dietType: null }] } };

    expect(toWeekRequest(draft, slots).days[0]).toEqual({
      dayOfWeek: 'MONDAY',
      note: 'Fresh fruit',
      meals: [{ slotId: 'breakfast', items: [{ name: 'Idli', dietType: null }] }],
    });
  });

  it('flags a day with an unnamed dish', () => {
    const draft = toDraft(menu);
    draft.TUESDAY = { note: '', items: { dinner: [{ key: 'k', name: '  ', dietType: null }] } };

    expect(validateDraft(draft, slots)).toEqual({ TUESDAY: 'Every dish in Dinner needs a name' });
  });

  it("copies one day's dishes to others without touching their notes", () => {
    const copied = copyDay(toDraft(menu), 'MONDAY', ['SATURDAY', 'SUNDAY']);

    expect(copied.SUNDAY.note).toBe('Sunday special');
    expect(copied.SUNDAY.items.breakfast.map((i) => i.name)).toEqual(['Poha']);
    expect(copied.SUNDAY.items.breakfast[0].key).not.toBe(copied.MONDAY.items.breakfast[0].key);
    expect(copied.TUESDAY.items.breakfast).toEqual([]);
  });
});

describe('meal slots', () => {
  it('rejects duplicate names whatever the case', () => {
    const rows = [slotRow({ key: 'a', name: 'Lunch' }), slotRow({ key: 'b', name: ' lunch ' })];

    expect(validateSlots(rows)).toEqual({ b: "There's already a meal called lunch" });
  });

  it('needs both times or neither, ending after the start', () => {
    expect(validateSlots([slotRow({ key: 'a', startTime: '12:00' })])).toEqual({ a: 'Pick both a start and an end time, or neither' });
    expect(validateSlots([slotRow({ key: 'a', startTime: '14:00', endTime: '13:00' })])).toEqual({ a: 'The meal must end after it starts' });
    expect(validateSlots([slotRow({ key: 'a', startTime: '12:30', endTime: '14:30' })])).toEqual({});
  });

  it('sends empty times as null', () => {
    expect(toSlotRequests([slotRow({ id: 's1', name: ' Bed tea ' })])).toEqual([{ id: 's1', name: 'Bed tea', startTime: null, endTime: null }]);
  });

  it('formats the serving time only when both ends are set', () => {
    expect(formatSlotTime(slots[0])).toBe('7:30 AM – 9:30 AM');
    expect(formatSlotTime(slots[1])).toBeNull();
  });
});

describe('todayDayOfWeek', () => {
  it('maps JavaScript days, which start on Sunday, to backend days', () => {
    expect(todayDayOfWeek(new Date(2026, 8, 27))).toBe('SUNDAY');
    expect(todayDayOfWeek(new Date(2026, 8, 28))).toBe('MONDAY');
  });
});
