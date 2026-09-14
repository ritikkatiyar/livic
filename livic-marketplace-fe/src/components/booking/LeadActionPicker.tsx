'use client';

import { Calendar, CreditCard } from 'lucide-react';
import { LeadType } from '@/types/lead';

type Props = {
  selectedType: LeadType;
  availableActions: LeadType[];
  onSelectType: (type: LeadType) => void;
};

export function LeadActionPicker({ selectedType, availableActions, onSelectType }: Props) {
  const canBook = availableActions.includes('BOOKING');
  const canTour = availableActions.includes('TOUR_REQUEST');

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3" id="lead-action-picker">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
        Select Action Type
      </span>

      <div className="grid grid-cols-2 gap-3">
        {canTour && (
          <button
            type="button"
            onClick={() => onSelectType('TOUR_REQUEST')}
            id="action-picker-tour-btn"
            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              selectedType === 'TOUR_REQUEST'
                ? 'bg-indigo-600/10 dark:bg-indigo-600/20 border-indigo-500 text-slate-900 dark:text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500'
                : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Calendar className={`h-6 w-6 ${selectedType === 'TOUR_REQUEST' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
            <div>
              <span className="text-xs sm:text-sm font-bold block">Request a Tour</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Schedule site visit</span>
            </div>
          </button>
        )}

        {canBook && (
          <button
            type="button"
            onClick={() => onSelectType('BOOKING')}
            id="action-picker-booking-btn"
            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              selectedType === 'BOOKING'
                ? 'bg-indigo-600/10 dark:bg-indigo-600/20 border-indigo-500 text-slate-900 dark:text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500'
                : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <CreditCard className={`h-6 w-6 ${selectedType === 'BOOKING' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
            <div>
              <span className="text-xs sm:text-sm font-bold block">Instant Token Booking</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Refundable Token</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
