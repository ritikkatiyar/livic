'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { parseLocalIsoDate, toLocalIsoDate } from '@/utils/visitSlots';

type DateStripProps = {
  /** Selectable dates as `YYYY-MM-DD` (local time), in order. */
  dates: string[];
  value: string;
  onChange: (date: string) => void;
  label: string;
  id?: string;
  /** Used to label "Today" / "Tomorrow"; defaults to the current date. */
  today?: Date;
};

const weekdayFormat = new Intl.DateTimeFormat('en-IN', { weekday: 'short' });
const monthFormat = new Intl.DateTimeFormat('en-IN', { month: 'short' });
const fullFormat = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export function DateStrip({ dates, value, onChange, label, id, today = new Date() }: DateStripProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const todayIso = toLocalIsoDate(today);
  const tomorrowIso = toLocalIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
  const selectedIndex = Math.max(0, dates.indexOf(value));

  const select = (index: number) => {
    const next = Math.min(Math.max(index, 0), dates.length - 1);
    onChange(dates[next]);
    const option = optionRefs.current[next];
    option?.focus();
    option?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keyMoves: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (e.key in keyMoves) {
      e.preventDefault();
      select(index + keyMoves[e.key]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      select(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      select(dates.length - 1);
    }
  };

  const scrollBy = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * 240, behavior: 'smooth' });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Show earlier dates"
        tabIndex={-1}
        className="hidden sm:flex shrink-0 h-8 w-8 items-center justify-center rounded-full glass-card border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 shadow"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div
        ref={scrollerRef}
        role="radiogroup"
        aria-label={label}
        id={id}
        className="flex flex-1 min-w-0 gap-2 overflow-x-auto scrollbar-none scroll-smooth snap-x px-0.5 py-1"
      >
        {dates.map((date, index) => {
          const d = parseLocalIsoDate(date);
          const selected = date === value;
          const relative = date === todayIso ? 'Today' : date === tomorrowIso ? 'Tomorrow' : weekdayFormat.format(d);

          return (
            <button
              key={date}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={fullFormat.format(d)}
              tabIndex={index === selectedIndex ? 0 : -1}
              onClick={() => onChange(date)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`snap-start shrink-0 w-[4.75rem] rounded-xl border px-1 py-2.5 flex flex-col items-center gap-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                selected
                  ? 'bg-gradient-to-b from-indigo-600 to-purple-600 border-transparent text-white shadow-lg shadow-indigo-600/30'
                  : 'glass-card border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-300'
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap ${selected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                {relative}
              </span>
              <span className="text-lg font-extrabold leading-none">{d.getDate()}</span>
              <span className={`text-[11px] font-medium ${selected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                {monthFormat.format(d)}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Show later dates"
        tabIndex={-1}
        className="hidden sm:flex shrink-0 h-8 w-8 items-center justify-center rounded-full glass-card border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 shadow"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
