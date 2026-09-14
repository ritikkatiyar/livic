'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function RoomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-6">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Room Information Unavailable</h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          {error.message || 'We could not retrieve details for this room. It may no longer be available.'}
        </p>
      </div>

      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs border border-slate-300 dark:border-slate-700 transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/market-place"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Return to Search
        </Link>
      </div>
    </div>
  );
}
