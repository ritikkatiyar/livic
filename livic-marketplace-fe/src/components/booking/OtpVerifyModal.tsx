'use client';

import React, { useEffect, useRef } from 'react';
import { X, ShieldAlert, CheckCircle2, RotateCcw } from 'lucide-react';

// The mock API and the backend dev profile both accept 000000; never advertise it in production builds
const SHOW_DEV_OTP_HINT = process.env.NODE_ENV !== 'production';

type Props = {
  isOpen: boolean;
  phone: string;
  code: string;
  setCode: (c: string) => void;
  onVerify: (code: string) => void;
  onResend: () => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  cooldown: number;
};

export function OtpVerifyModal({
  isOpen,
  phone,
  code,
  setCode,
  onVerify,
  onResend,
  onClose,
  loading,
  error,
  cooldown,
}: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when modal opens & handle Escape key focus trap
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      onVerify(code);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="otp-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-6 relative"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          id="close-otp-modal-btn"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Close OTP Verification Modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 id="otp-modal-title" className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Verify Mobile Number
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Enter the 6-digit code sent to <span className="text-indigo-600 dark:text-indigo-300 font-semibold">+91 {phone}</span>
          </p>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="otp-code-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 text-center mb-2">
              Verification Code
              {SHOW_DEV_OTP_HINT && (
                <>
                  {' '}(Use <span className="text-indigo-600 dark:text-amber-300 font-mono font-bold">000000</span> in development)
                </>
              )}
            </label>
            <input
              ref={inputRef}
              type="text"
              id="otp-code-input"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 rounded-xl glass-input text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            id="verify-otp-submit-btn"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {loading ? 'Verifying...' : 'Verify Code & Proceed'}
          </button>
        </form>

        {/* Resend Affordance */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
          <span className="text-slate-600 dark:text-slate-400">Didn&apos;t receive code?</span>
          <button
            type="button"
            onClick={onResend}
            disabled={cooldown > 0 || loading}
            id="resend-otp-btn"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 disabled:text-slate-400 dark:disabled:text-slate-600 font-medium flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
          >
            <RotateCcw className="h-3 w-3" />
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
