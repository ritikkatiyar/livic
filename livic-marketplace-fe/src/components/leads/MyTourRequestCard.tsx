'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, CalendarClock, DoorOpen, MapPin, MessageSquareQuote, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatVisitSlot, getTourStatusPresentation } from '@/features/leads/tourStatus';
import { MyTourRequest } from '@/types/lead';
import { formatDate } from '@/utils/formatDate';

type Props = {
  request: MyTourRequest;
  onCancel: (leadId: string) => Promise<void> | void;
  isCancelling: boolean;
};

export function MyTourRequestCard({ request, onCancel, isCancelling }: Props) {
  const [confirming, setConfirming] = useState(false);
  const status = getTourStatusPresentation(request.status);
  const propertyHref = `/market-place/${request.propertyId}`;

  return (
    <article
      className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4"
      id={`my-tour-request-${request.id}`}
      aria-label={`Tour request for ${request.propertyName ?? 'property'}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <Link
            href={propertyHref}
            className="text-base font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors flex items-center gap-2"
          >
            <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">{request.propertyName ?? 'Property'}</span>
          </Link>
          {(request.propertyAddress || request.propertyCity) && (
            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{[request.propertyAddress, request.propertyCity].filter(Boolean).join(', ')}</span>
            </p>
          )}
        </div>
        <div className="self-start">
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" /> Visit
          </span>
          <span className="block text-sm font-semibold text-slate-900 dark:text-white mt-1">{formatVisitSlot(request.preferredSlot)}</span>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <DoorOpen className="h-3.5 w-3.5" /> Room
          </span>
          {request.unitNumber ? (
            <Link
              href={`${propertyHref}/rooms/${request.unitId}`}
              className="block text-sm font-semibold text-indigo-600 dark:text-indigo-300 hover:underline mt-1"
            >
              Unit {request.unitNumber}
            </Link>
          ) : (
            <span className="block text-sm font-semibold text-slate-900 dark:text-white mt-1">—</span>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400">{status.description}</p>

      {request.decisionNote && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10 p-3 flex gap-2">
          <MessageSquareQuote className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Note from the property manager</span>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">{request.decisionNote}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">Requested {formatDate(request.createdAt)}</span>

        {request.cancellable &&
          (confirming ? (
            <div className="flex items-center gap-2" role="group" aria-label="Confirm cancellation">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Cancel this visit?</span>
              <button
                type="button"
                onClick={async () => {
                  await onCancel(request.id);
                  setConfirming(false);
                }}
                disabled={isCancelling}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {isCancelling ? 'Cancelling…' : 'Yes, cancel'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={isCancelling}
                className="px-3 py-1.5 rounded-lg glass-card border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Keep it
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <X className="h-3.5 w-3.5" /> Cancel visit
            </button>
          ))}
      </div>
    </article>
  );
}
