'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Phone, ShieldCheck } from 'lucide-react';
import { ApiError } from '@/api/client';
import { cancelMyTourRequest, getMyTourRequests } from '@/api/marketplace';
import { OtpVerifyModal } from '@/components/booking/OtpVerifyModal';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { isOtpSessionError } from '@/features/leads/otpSessionStorage';
import { MY_REQUESTS_PATH } from '@/features/leads/tourStatus';
import { useOtpVerification } from '@/features/leads/useOtpVerification';
import { PagedResult } from '@/types/api';
import { MyTourRequest } from '@/types/lead';
import { getErrorMessage } from '@/utils/errors';
import { MyTourRequestCard } from './MyTourRequestCard';

const PHONE_PATTERN = /^[6-9]\d{9}$/;

type LoadedRequests = {
  key: string;
  data: PagedResult<MyTourRequest> | null;
  error: string | null;
};

export function maskPhone(phone: string): string {
  return phone.length > 4 ? `${'•'.repeat(phone.length - 4)}${phone.slice(-4)}` : phone;
}

export function MyRequestsView({ page }: { page: number }) {
  const otp = useOtpVerification();
  const { otpSessionToken, verifiedPhone, isSessionRestored, clearSession } = otp;

  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const [reloadCount, setReloadCount] = useState(0);
  // Results are tagged with the request they answer, so a stale response never shows for a new page/session
  const [loaded, setLoaded] = useState<LoadedRequests | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const requestKey = otpSessionToken ? `${otpSessionToken}:${page}:${reloadCount}` : null;

  const handleSessionFailure = useCallback(
    (message: string) => {
      clearSession();
      setSessionNotice(message);
    },
    [clearSession]
  );

  useEffect(() => {
    if (!otpSessionToken || !requestKey) return;
    let active = true;
    getMyTourRequests(otpSessionToken, page).then(
      (res) => {
        if (!active) return;
        setLoaded({ key: requestKey, data: res.data ?? { items: [], page, pageSize: 0, totalItems: 0, totalPages: 0 }, error: null });
      },
      (err) => {
        if (!active) return;
        const message = getErrorMessage(err);
        if (isOtpSessionError(message)) {
          handleSessionFailure('Your verification has expired. Please verify your phone number again.');
          return;
        }
        setLoaded((prev) => ({ key: requestKey, data: prev?.data ?? null, error: message }));
      }
    );
    return () => {
      active = false;
    };
  }, [otpSessionToken, page, requestKey, handleSessionFailure]);

  const reload = () => setReloadCount((c) => c + 1);
  const isLoading = Boolean(requestKey) && loaded?.key !== requestKey;
  const result = loaded?.data ?? null;
  const loadError = isLoading ? null : loaded?.error ?? null;

  const handleSendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const phone = phoneInput.trim();
    if (!PHONE_PATTERN.test(phone)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setPhoneError(null);
    setSessionNotice(null);
    await otp.initiateOtp(phone);
  };

  const handleCancel = async (leadId: string) => {
    if (!otpSessionToken) return;
    setCancellingId(leadId);
    setActionMessage(null);
    try {
      const res = await cancelMyTourRequest(otpSessionToken, leadId);
      const cancelled = res.data;
      if (cancelled) {
        setLoaded((prev) =>
          prev?.data
            ? { ...prev, data: { ...prev.data, items: prev.data.items.map((r) => (r.id === leadId ? cancelled : r)) } }
            : prev
        );
      }
      setActionMessage({ tone: 'success', text: 'Your visit has been cancelled. You can request a new visit at this property anytime.' });
    } catch (err) {
      const message = getErrorMessage(err);
      if (isOtpSessionError(message)) {
        handleSessionFailure('Your verification has expired. Please verify again to cancel this visit.');
        return;
      }
      setActionMessage({ tone: 'error', text: message });
      if (err instanceof ApiError && err.status === 409) {
        // Already decided or the visit time passed: show the current state
        reload();
      }
    } finally {
      setCancellingId(null);
    }
  };

  const handleUseDifferentNumber = () => {
    clearSession();
    setLoaded(null);
    setPhoneInput('');
    setActionMessage(null);
  };

  // Wait for any session remembered in this tab before choosing between the phone form and the list
  if (!isSessionRestored) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading your requests">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!otpSessionToken || !verifiedPhone) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-5 max-w-md">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Verify your phone number
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Enter the mobile number you used to request a visit. We&apos;ll send a one-time code to confirm it&apos;s you.
          </p>
        </div>

        {sessionNotice && (
          <p className="text-xs rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 p-2.5" role="status">
            {sessionNotice}
          </p>
        )}

        <form onSubmit={handleSendCode} className="space-y-3" id="my-requests-phone-form">
          <div>
            <label htmlFor="my-requests-phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="my-requests-phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 9876543210"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
            {(phoneError || (!otp.isModalOpen && otp.error)) && (
              <span className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 block" role="alert">
                {phoneError || otp.error}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={otp.loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {otp.loading ? 'Sending code…' : 'Send verification code'}
          </button>
        </form>

        <OtpVerifyModal
          isOpen={otp.isModalOpen}
          phone={otp.phone}
          code={otp.otpCode}
          setCode={otp.setOtpCode}
          onVerify={async (code) => {
            await otp.submitOtpCode(code);
          }}
          onResend={otp.resendOtp}
          onClose={otp.closeModal}
          loading={otp.loading}
          error={otp.error}
          cooldown={otp.cooldown}
        />
      </div>
    );
  }

  const items = result?.items ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-600 dark:text-slate-400" id="my-requests-phone-summary">
          Showing requests for <span className="font-semibold text-slate-900 dark:text-white">+91 {maskPhone(verifiedPhone)}</span>
        </p>
        <button
          type="button"
          onClick={handleUseDifferentNumber}
          className="self-start text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:underline focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
        >
          Use a different number
        </button>
      </div>

      {actionMessage && (
        <p
          role={actionMessage.tone === 'error' ? 'alert' : 'status'}
          className={`text-xs rounded-lg border p-2.5 ${
            actionMessage.tone === 'error'
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {actionMessage.text}
        </p>
      )}

      {isLoading && !result ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading your requests">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      ) : loadError ? (
        <div className="glass-panel rounded-2xl p-6 border border-rose-500/30 text-center space-y-3" role="alert">
          <p className="text-sm text-slate-800 dark:text-slate-200">{loadError}</p>
          <button
            type="button"
            onClick={reload}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <ClipboardList className="h-8 w-8 mx-auto text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">No tour requests yet</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Find a room you like and request a visit — it will show up here.</p>
          <Link
            href="/market-place"
            className="inline-flex px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Explore properties
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((request) => (
            <MyTourRequestCard
              key={request.id}
              request={request}
              onCancel={handleCancel}
              isCancelling={cancellingId === request.id}
            />
          ))}
        </div>
      )}

      {result && (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          buildHref={(p) => (p > 1 ? `${MY_REQUESTS_PATH}?page=${p}` : MY_REQUESTS_PATH)}
          label="My requests pagination"
        />
      )}
    </div>
  );
}
