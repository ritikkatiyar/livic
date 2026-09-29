import { DAY_LABELS, DAYS_OF_WEEK, DayOfWeek, formatTime, toMinutes } from '@/src/utils/weekdays';
import { DietType, MealSlot, MealSlotRequest, MessMenu, UpdateWeekMenuRequest } from '../api/messMenu.api';

// Limits the backend enforces
export const MAX_SLOTS = 8;
export const MAX_ITEMS_PER_MEAL = 15;
export const MAX_SLOT_NAME = 40;
export const MAX_ITEM_NAME = 80;
export const MAX_NOTE = 200;

export const DIET_TYPES: DietType[] = ['VEG', 'EGG', 'NON_VEG'];
export const DIET_LABELS: Record<DietType, string> = { VEG: 'Veg', EGG: 'Egg', NON_VEG: 'Non-veg' };

/** Offered when a property has no meals yet. */
export const SUGGESTED_SLOTS: Omit<MealSlotRequest, 'id'>[] = [
  { name: 'Breakfast', startTime: '07:30', endTime: '09:30' },
  { name: 'Lunch', startTime: '12:30', endTime: '14:30' },
  { name: 'Evening snacks', startTime: '17:00', endTime: '18:00' },
  { name: 'Dinner', startTime: '20:00', endTime: '22:00' },
];

export interface DraftItem {
  /** Stable React key: the saved id, or a generated one for a new dish. */
  key: string;
  name: string;
  dietType: DietType | null;
}

export interface DraftDay {
  note: string;
  /** Dishes by meal slot id. */
  items: Record<string, DraftItem[]>;
}

/** Editable copy of the week, every day present. */
export type MessMenuDraft = Record<DayOfWeek, DraftDay>;

let keySeq = 0;
export function newItemKey(): string {
  keySeq += 1;
  return `new-${keySeq}`;
}

export function toDraft(menu: MessMenu): MessMenuDraft {
  const draft = Object.fromEntries(DAYS_OF_WEEK.map((day) => [day, { note: '', items: {} }])) as MessMenuDraft;
  menu.days.forEach((day) => {
    draft[day.dayOfWeek] = {
      note: day.note ?? '',
      items: Object.fromEntries(day.meals.map((meal) => [
        meal.slotId,
        meal.items.map((item) => ({ key: item.id, name: item.name, dietType: item.dietType })),
      ])),
    };
  });
  return draft;
}

/**
 * The week as the backend takes it. Built from the current slots, so dishes under a slot that has
 * since been deleted drop out and a new slot starts empty.
 */
export function toWeekRequest(draft: MessMenuDraft, slots: MealSlot[]): UpdateWeekMenuRequest {
  return {
    days: DAYS_OF_WEEK.map((day) => ({
      dayOfWeek: day,
      note: draft[day].note.trim() || null,
      meals: slots
        .map((slot) => ({
          slotId: slot.id,
          items: (draft[day].items[slot.id] ?? []).map((item) => ({ name: item.name.trim(), dietType: item.dietType })),
        }))
        .filter((meal) => meal.items.length > 0),
    })),
  };
}

export function isDraftEqual(a: MessMenuDraft, b: MessMenuDraft, slots: MealSlot[]): boolean {
  return JSON.stringify(toWeekRequest(a, slots)) === JSON.stringify(toWeekRequest(b, slots));
}

/** Per-day problems the backend would reject; an empty object means the week can be saved. */
export function validateDraft(draft: MessMenuDraft, slots: MealSlot[]): Partial<Record<DayOfWeek, string>> {
  const errors: Partial<Record<DayOfWeek, string>> = {};
  DAYS_OF_WEEK.forEach((day) => {
    const { note, items } = draft[day];
    if (note.trim().length > MAX_NOTE) {
      errors[day] = `Keep the note under ${MAX_NOTE} characters`;
      return;
    }
    for (const slot of slots) {
      const dishes = items[slot.id] ?? [];
      if (dishes.length > MAX_ITEMS_PER_MEAL) {
        errors[day] = `${slot.name} can have at most ${MAX_ITEMS_PER_MEAL} dishes`;
        return;
      }
      if (dishes.some((item) => !item.name.trim())) {
        errors[day] = `Every dish in ${slot.name} needs a name`;
        return;
      }
      if (dishes.some((item) => item.name.trim().length > MAX_ITEM_NAME)) {
        errors[day] = `Dish names can be at most ${MAX_ITEM_NAME} characters`;
        return;
      }
    }
  });
  return errors;
}

/** Copies one day's dishes onto other days, replacing theirs. Notes stay with their own day. */
export function copyDay(draft: MessMenuDraft, from: DayOfWeek, to: DayOfWeek[]): MessMenuDraft {
  const next = { ...draft };
  to.forEach((day) => {
    const items = Object.fromEntries(Object.entries(draft[from].items).map(([slotId, dishes]) => [
      slotId,
      dishes.map((item) => ({ ...item, key: newItemKey() })),
    ]));
    next[day] = { ...draft[day], items };
  });
  return next;
}

/** A row in the meals editor; times are `''` when the meal has no set time. */
export interface SlotDraft {
  key: string;
  id: string | null;
  name: string;
  startTime: string;
  endTime: string;
}

/** Per-row problems in the meals editor; an empty object means the list can be saved. */
export function validateSlots(rows: SlotDraft[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const seen = new Set<string>();
  rows.forEach((row) => {
    const name = row.name.trim();
    if (!name) {
      errors[row.key] = 'Give this meal a name';
    } else if (name.length > MAX_SLOT_NAME) {
      errors[row.key] = `Keep the name under ${MAX_SLOT_NAME} characters`;
    } else if (seen.has(name.toLowerCase())) {
      errors[row.key] = `There's already a meal called ${name}`;
    } else if (Boolean(row.startTime) !== Boolean(row.endTime)) {
      errors[row.key] = 'Pick both a start and an end time, or neither';
    } else if (row.startTime && toMinutes(row.endTime) <= toMinutes(row.startTime)) {
      errors[row.key] = 'The meal must end after it starts';
    }
    seen.add(name.toLowerCase());
  });
  return errors;
}

export function toSlotRequests(rows: SlotDraft[]): MealSlotRequest[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name.trim(),
    startTime: row.startTime || null,
    endTime: row.endTime || null,
  }));
}

/** `7:30 AM – 9:30 AM`, or null when the meal has no set time. */
export function formatSlotTime(slot: Pick<MealSlot, 'startTime' | 'endTime'>): string | null {
  return slot.startTime && slot.endTime ? `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}` : null;
}

export function countDishes(day: DraftDay, slots: MealSlot[]): number {
  return slots.reduce((total, slot) => total + (day.items[slot.id]?.length ?? 0), 0);
}

export function dayLabel(day: DayOfWeek): string {
  return DAY_LABELS[day].long;
}
