import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { MyRequestsView } from '@/components/leads/MyRequestsView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Requests | Livic Marketplace',
  description: 'Track the status of your property visit requests.',
  // Personal, verification-gated page: keep it out of search results
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function parsePage(value: string | string[] | undefined): number {
  const parsed = Number.parseInt(Array.isArray(value) ? value[0] : value ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

export default async function MyRequestsPage({ searchParams }: Props) {
  const page = parsePage((await searchParams).page);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        href="/market-place"
        className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors inline-flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Search
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <ClipboardList className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          My Requests
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          See whether your property visits were approved, read notes from the property manager, or cancel a visit.
        </p>
      </header>

      <MyRequestsView page={page} />
    </div>
  );
}
