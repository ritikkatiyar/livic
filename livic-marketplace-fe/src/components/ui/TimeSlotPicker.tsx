'use client';

import React, { useRef } from 'react';
import { Sunrise, Sun, Sunset } from 'lucide-react';
import { formatSlotLabel, getSlotPeriod, SlotPeriod } from '@/utils/visitSlots';

type TimeSlotPickerProps = {
  /** All slots as `HH:mm`, in order. */
  slots: string[];
  /** Slots that can currently be chosen; the rest render disabled. */
  availableSlots: string[];
  value: string;
  onChange: (slot: string) => void;
  label: string;
  id?: string;
};

const PERIOD_ICONS: Record<SlotPeriod, React.ComponentType<{ className?: string }>> = {
  Morning: Sunrise,
  Afternoon: Sun,
  Evening: Sunset,
};

export function TimeSlotPicker({ slots, availableSlots, value, onChange, label, id }: TimeSlotPickerProps) {
  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const periods = (['Morning', 'Afternoon', 'Evening'] as SlotPeriod[])
    .map((period) => ({ period, slots: slots.filter((s) => getSlotPeriod(s) === period) }))
    .filter((group) => group.slots.length > 0);

  const focusable = availableSlots.includes(value) ? value : availableSlots[0];

  const move = (from: string, step: number) => {
    const index = availableSlots.indexOf(from);
    const next = availableSlots[Math.min(Math.max(index + step, 0), availableSlots.length - 1)];
    if (next) {
      onChange(next);
      optionRefs.current[next]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, slot: string) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      move(slot, 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      move(slot, -1);
    }
  };

  if (availableSlots.length === 0) {
    return (
      <p className="text-xs text-slate-600 dark:text-slate-400 py-3 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        No visit slots left on this day. Please pick another date.
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
                const available = availableSlots.includes(slot);
                const selected = available && slot === value;
                return (
                  <button
                    key={slot}
                    ref={(el) => {
                      optionRefs.current[slot] = el;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-disabled={!available}
                    disabled={!available}
                    tabIndex={slot === focusable ? 0 : -1}
                    onClick={() => onChange(slot)}
                    onKeyDown={(e) => handleKeyDown(e, slot)}
                    className={`rounded-lg border py-2 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      selected
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-transparent text-white shadow-lg shadow-indigo-600/30'
                        : available
                          ? 'glass-card border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 line-through cursor-not-allowed'
                    }`}
                  >
                    {formatSlotLabel(slot)}
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
