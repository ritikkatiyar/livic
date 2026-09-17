import Link from 'next/link';
import { DoorOpen } from 'lucide-react';
import { UnitSummary } from '@/types/unit';
import { Pagination } from '../ui/Pagination';
import { RoomCard } from './RoomCard';

export const ROOMS_SECTION_ID = 'available-rooms-section';

type RoomListProps = {
  propertyId: string;
  units: UnitSummary[];
  page: number; // 1-based
  pageSize: number;
  totalPages: number;
  totalItems: number;
  totalUnitsCount: number;
  availableUnitsCount: number;
  availableOnly: boolean;
};

export function buildRoomsHref(propertyId: string, page: number, availableOnly: boolean): string {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (availableOnly) params.set('available', '1');
  const query = params.toString();
  return `/market-place/${propertyId}${query ? `?${query}` : ''}#${ROOMS_SECTION_ID}`;
}

const filterBase =
  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500';
const filterActive = 'bg-indigo-600 text-white shadow shadow-indigo-600/25';
const filterIdle = 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300';

export function RoomList({
  propertyId,
  units,
  page,
  pageSize,
  totalPages,
  totalItems,
  totalUnitsCount,
  availableUnitsCount,
  availableOnly,
}: RoomListProps) {
  if (totalUnitsCount === 0) return null;

  const firstShown = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastShown = Math.min(page * pageSize, totalItems);

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 scroll-mt-24" id={ROOMS_SECTION_ID}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <DoorOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Rooms & Units ({totalUnitsCount})
          </h3>
          {totalItems > 0 && (
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Showing {firstShown}–{lastShown} of {totalItems} {availableOnly ? 'available rooms' : 'rooms'}
            </p>
          )}
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-xl glass-card border border-slate-200 dark:border-slate-800 self-start sm:self-auto" role="group" aria-label="Filter rooms">
          <Link
            href={buildRoomsHref(propertyId, 1, false)}
            className={`${filterBase} ${availableOnly ? filterIdle : filterActive}`}
            aria-current={availableOnly ? undefined : 'true'}
          >
            All rooms
          </Link>
          <Link
            href={buildRoomsHref(propertyId, 1, true)}
            className={`${filterBase} ${availableOnly ? filterActive : filterIdle}`}
            aria-current={availableOnly ? 'true' : undefined}
          >
            Available only ({availableUnitsCount})
          </Link>
        </div>
      </div>

      {units.length > 0 ? (
        <div className="space-y-4">
          {units.map((unit) => (
            <RoomCard key={unit.id} propertyId={propertyId} unit={unit} />
          ))}
        </div>
      ) : (
        <div className="py-10 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No rooms available right now</p>
          <Link
            href={buildRoomsHref(propertyId, 1, false)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:underline"
          >
            View all rooms
          </Link>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        buildHref={(p) => buildRoomsHref(propertyId, p, availableOnly)}
        label="Rooms pagination"
      />
    </div>
  );
}
