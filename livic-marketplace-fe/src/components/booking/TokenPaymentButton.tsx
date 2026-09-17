'use client';

import { ShieldAlert, RefreshCw, CreditCard } from 'lucide-react';
import { LeadResponse } from '@/types/lead';
import { useTokenPayment } from '@/features/leads/useTokenPayment';
import { formatCurrency } from '@/utils/formatCurrency';

type Props = {
  lead: LeadResponse;
  onSuccess: (confirmedLead: LeadResponse) => void;
};

export function TokenPaymentButton({ lead, onSuccess }: Props) {
  const { handlePayment, loading, error, pollingStatus, leadStatus } = useTokenPayment();

  const onPayClick = async () => {
    await handlePayment(lead);
  };

  // If status resolved during payment hook execution
  if ((pollingStatus === 'CONFIRMED' || pollingStatus === 'UNCONFIRMED_RECEIVED') && leadStatus) {
    onSuccess(leadStatus);
  }

  return (
    <div className="space-y-4" id="token-payment-section">
      <div className="glass-card p-5 rounded-2xl border border-indigo-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Refundable Advance Token</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(lead.tokenAmount || 2000)}</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Your booking lead request has been created! Pay the token amount to instantly reserve this unit.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {pollingStatus === 'POLLING' ? (
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span>Verifying payment receipt with backend (polling)...</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onPayClick}
            disabled={loading}
            id="pay-token-now-btn"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <CreditCard className="h-4 w-4" />
            <span>{loading ? 'Processing Payment...' : `Pay ${formatCurrency(lead.tokenAmount || 2000)} via Razorpay`}</span>
          </button>
        )}
      </div>
    </div>
  );
}
