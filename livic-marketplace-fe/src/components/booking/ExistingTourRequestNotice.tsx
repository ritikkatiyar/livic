import Link from 'next/link';
import { CalendarClock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ExistingTourRequest } from '@/types/lead';
import { formatVisitSlot, getTourStatusPresentation, MY_REQUESTS_PATH } from '@/features/leads/tourStatus';

type Props = {
  /** Null when the server detected the duplicate without details (concurrent submission). */
  existingRequest: ExistingTourRequest | null;
  onDismiss?: () => void;
};

/** Shown instead of creating a second tour request when the phone already has an active one at this property. */
export function ExistingTourRequestNotice({ existingRequest, onDismiss }: Props) {
  const status = existingRequest ? getTourStatusPresentation(existingRequest.status) : null;

  return (
    <div
      className="rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 p-4 space-y-3"
      role="status"
      id="existing-tour-request-notice"
    >
      <div className="flex items-start gap-3">
        <CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white">You already have a visit request at this property</p>
          {existingRequest ? (
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {existingRequest.unitNumber ? `Unit ${existingRequest.unitNumber} · ` : ''}
              {formatVisitSlot(existingRequest.preferredSlot)}
            </p>
          ) : (
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Only one active tour request per property is allowed for a phone number.
            </p>
          )}
          {status && <Badge variant={status.variant}>{status.label}</Badge>}
        </div>
      </div>

      <p className="text-[11px] text-slate-600 dark:text-slate-400">
        You can request another visit here once this one is declined, cancelled or completed.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <Link
          href={MY_REQUESTS_PATH}
          id="view-my-requests-link"
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          View my requests <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2.5 rounded-xl glass-card border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Change details
          </button>
        )}
      </div>
    </div>
  );
}
