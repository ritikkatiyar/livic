import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  page: number; // 1-based
  totalPages: number;
  buildHref: (page: number) => string;
  label?: string;
};

type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

/** Page numbers to show: always first and last, plus a window of one page around the current page. */
export function getPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const start = Math.max(2, Math.min(page - 1, totalPages - 4));
  const end = Math.min(totalPages - 1, Math.max(page + 1, 5));
  const items: PageItem[] = [1];

  if (start > 2) items.push('ellipsis-start');
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push('ellipsis-end');
  items.push(totalPages);

  return items;
}

const baseItem =
  'min-w-9 h-9 px-3 inline-flex items-center justify-center rounded-xl text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500';
const idleItem =
  'glass-card border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-300';
const activeItem = 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/25';
const disabledItem = 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed';

export function Pagination({ page, totalPages, buildHref, label = 'Pagination' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav aria-label={label} className="flex items-center justify-center gap-1.5 flex-wrap">
      {hasPrev ? (
        <Link href={buildHref(page - 1)} className={`${baseItem} ${idleItem} gap-1`} aria-label="Previous page">
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </Link>
      ) : (
        <span className={`${baseItem} ${disabledItem} gap-1`} aria-disabled="true">
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </span>
      )}

      {getPageItems(page, totalPages).map((item) =>
        typeof item === 'number' ? (
          <Link
            key={item}
            href={buildHref(item)}
            className={`${baseItem} ${item === page ? activeItem : idleItem}`}
            aria-current={item === page ? 'page' : undefined}
            aria-label={`Page ${item}`}
          >
            {item}
          </Link>
        ) : (
          <span key={item} className="px-1 text-xs text-slate-500 dark:text-slate-400" aria-hidden="true">
            …
          </span>
        )
      )}

      {hasNext ? (
        <Link href={buildHref(page + 1)} className={`${baseItem} ${idleItem} gap-1`} aria-label="Next page">
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <span className={`${baseItem} ${disabledItem} gap-1`} aria-disabled="true">
          Next <ChevronRight className="h-3.5 w-3.5" />
        </span>
      )}
    </nav>
  );
}
