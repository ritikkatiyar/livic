import Link from 'next/link';
import { Building2, ArrowLeft } from 'lucide-react';

export default function PropertyNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center space-y-6">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
        <Building2 className="h-10 w-10" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Property Not Found</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
          The property you are looking for might have been unlisted, filled, or the URL is incorrect.
        </p>
      </div>

      <div className="pt-4">
        <Link
          href="/market-place"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Marketplace Search
        </Link>
      </div>
    </div>
  );
}
