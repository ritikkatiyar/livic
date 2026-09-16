'use client';

import React, { useRef } from 'react';
import { Sunrise, Sun, Sunset } from 'lucide-react';
import { TourSlot, TourSlotStatus } from '@/types/tourSlot';
import { formatSlotLabel, getSlotPeriod, SlotPeriod } from '@/utils/visitSlots';

type TimeSlotPickerProps = {
  /** The property's slots for the chosen date, in order. */
  slots: TourSlot[];
  /** `HH:mm` of the selected slot. */
  value: string;
  onChange: (localTime: string) => void;
  label: string;
  id?: string;
};

const PERIOD_ICONS: Record<SlotPeriod, React.ComponentType<{ className?: string }>> = {
  Morning: Sunrise,
  Afternoon: Sun,
  Evening: Sunset,
};

/** Short reason shown under a slot that can't be picked. */
const STATUS_NOTE: Partial<Record<TourSlotStatus, string>> = {
  DECLINED: 'Declined',
  FULL: 'Full',
};

const STATUS_DESCRIPTION: Partial<Record<TourSlotStatus, string>> = {
  DECLINED: 'declined by the property manager',
  FULL: 'fully booked',
  UNAVAILABLE: 'not available',
};

export function TimeSlotPicker({ slots, value, onChange, label, id }: TimeSlotPickerProps) {
  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const periods = (['Morning', 'Afternoon', 'Evening'] as SlotPeriod[])
    .map((period) => ({ period, slots: slots.filter((s) => getSlotPeriod(s.localTime) === period) }))
    .filter((group) => group.slots.length > 0);

  const bookable = slots.filter((s) => s.status === 'AVAILABLE').map((s) => s.localTime);
  const focusable = bookable.includes(value) ? value : bookable[0];

  const move = (from: string, step: number) => {
    const index = bookable.indexOf(from);
    const next = bookable[Math.min(Math.max(index + step, 0), bookable.length - 1)];
    if (next) {
      onChange(next);
      optionRefs.current[next]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, localTime: string) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      move(localTime, 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      move(localTime, -1);
    }
  };

  if (slots.length === 0) {
    return (
      <p className="text-xs text-slate-600 dark:text-slate-400 py-3 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        No visit times on this day. Please pick another date.
      </p>
    );
  }

  return (
    <div role="radiogroup" aria-label={label} id={id} className="space-y-3">
      {periods.map(({ period, slots: periodSlots }) => {
        const Icon = PERIOD_ICONS[period];
        return (
          <div key={period} className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Icon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> {period}
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {periodSlots.map((slot) => {
                const available = slot.status === 'AVAILABLE';
                const selected = available && slot.localTime === value;
                const note = STATUS_NOTE[slot.status];
                const timeLabel = formatSlotLabel(slot.localTime);
                return (
                  <button
                    key={slot.start}
                    ref={(el) => {
                      optionRefs.current[slot.localTime] = el;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-disabled={!available}
                    aria-label={available ? undefined : `${timeLabel}, ${STATUS_DESCRIPTION[slot.status]}`}
                    disabled={!available}
                    tabIndex={slot.localTime === focusable ? 0 : -1}
                    onClick={() => onChange(slot.localTime)}
                    onKeyDown={(e) => handleKeyDown(e, slot.localTime)}
                    className={`rounded-lg border py-2 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      selected
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-transparent text-white shadow-lg shadow-indigo-600/30'
                        : available
                          ? 'glass-card border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-300'
                          : note
                            ? 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10 text-rose-600/80 dark:text-rose-400/80 cursor-not-allowed'
                            : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 line-through cursor-not-allowed'
                    }`}
                  >
                    {timeLabel}
                    {note && <span className="block text-[10px] font-medium leading-tight">{note}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
