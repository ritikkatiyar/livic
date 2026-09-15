import Link from 'next/link';
import { CheckCircle2, ShieldCheck, PhoneCall, Building2, ClipboardList } from 'lucide-react';
import { LeadResponse } from '@/types/lead';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatDateTime } from '@/utils/formatDate';
import { Badge } from '@/components/ui/Badge';
import { getTourStatusPresentation, MY_REQUESTS_PATH } from '@/features/leads/tourStatus';

export function LeadConfirmation({ lead, propertyName }: { lead: LeadResponse; propertyName: string }) {
  const isBooking = lead.leadType === 'BOOKING';
  const tourStatus = getTourStatusPresentation(lead.status);

  return (
    <div className="glass-panel rounded-2xl p-8 border border-emerald-500/30 text-center space-y-6 animate-fade-in" id="lead-confirmation-card">
      <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
        <CheckCircle2 className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
          {isBooking ? 'Token Booking Confirmed' : 'Tour Request Sent'}
        </span>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {isBooking ? 'Unit Reserved Successfully!' : 'Awaiting landlord approval'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
          {isBooking
            ? `Your token payment has been received for ${propertyName}. The property manager will reach out to schedule your final agreement & keys handoff.`
            : `Your visit request for ${propertyName} has been sent. The property manager will approve or decline it — check its status anytime under My Requests.`}
        </p>
        {!isBooking && (
          <div className="flex justify-center pt-1">
            <Badge variant={tourStatus.variant}>{tourStatus.label}</Badge>
          </div>
        )}
      </div>

      {/* Confirmation Reference Box */}
      <div className="bg-slate-100 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 max-w-sm mx-auto text-left text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
          <span className="text-slate-600 dark:text-slate-400 font-medium">Reference Lead ID</span>
          <span className="font-mono text-indigo-600 dark:text-indigo-300 font-bold">{lead.id}</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-600 dark:text-slate-400 font-medium">Lead Type</span>
          <span className="text-slate-900 dark:text-white font-semibold">{lead.leadType}</span>
        </div>
        {!isBooking && lead.preferredSlot && (
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Requested Visit</span>
            <span className="text-slate-900 dark:text-white font-semibold">{formatDateTime(lead.preferredSlot)}</span>
          </div>
        )}
        {lead.tokenAmount && (
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Token Paid</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(lead.tokenAmount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800/60">
          <span className="text-slate-600 dark:text-slate-400 font-medium">Date</span>
          <span className="text-slate-800 dark:text-slate-300">{formatDate(lead.createdAt)}</span>
        </div>
      </div>

      {isBooking && (
        <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs text-slate-700 dark:text-slate-300 max-w-md mx-auto flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>This token payment is 100% refundable as per Livic Stays terms.</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {!isBooking && (
          <Link
            href={MY_REQUESTS_PATH}
            id="track-request-btn"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm shadow-indigo-600/25"
          >
            <ClipboardList className="h-4 w-4" />
            Track this request
          </Link>
        )}
        <Link
          href="/market-place"
          id="back-to-explore-btn"
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl glass-card text-slate-900 dark:text-white font-semibold text-xs border border-slate-300 dark:border-slate-700 hover:border-indigo-500 flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        >
          <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Explore More Properties
        </Link>
        <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 py-1">
          <PhoneCall className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Need help? Call +91 800-LIVIC-STAY
        </div>
      </div>
    </div>
  );
}
