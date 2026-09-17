import Link from 'next/link';
import { Users, ArrowRight, Ban, CheckCircle } from 'lucide-react';
import { UnitSummary } from '@/types/unit';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '@/utils/formatCurrency';

export function RoomCard({ propertyId, unit }: { propertyId: string; unit: UnitSummary }) {
  return (
    <div
      className={`glass-card rounded-2xl p-5 border transition-all ${
        unit.isBookable ? 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50' : 'border-slate-200 dark:border-slate-850 opacity-75'
      }`}
      id={`room-card-${unit.id}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Room Information */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Unit {unit.unitNumber} — <span className="text-indigo-600 dark:text-indigo-300 font-semibold">{unit.type}</span>
            </h4>

            {unit.isBookable ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle className="h-3 w-3" /> Available Now
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1">
                <Ban className="h-3 w-3" /> Currently Occupied
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Users className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> Max Capacity: {unit.capacity} {unit.capacity === 1 ? 'Person' : 'People'}
            </span>
          </div>

          {unit.description && (
            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">{unit.description}</p>
          )}

          {unit.amenities && unit.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {unit.amenities.slice(0, 4).map((am, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                >
                  {am}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price & Action CTA */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800/80 pt-3 sm:pt-0 sm:pl-6 shrink-0 gap-3">
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Base Rent</span>
            <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-300 tracking-tight">
              {formatCurrency(unit.basePrice, true)}
            </span>
          </div>

          <Link
            href={`/market-place/${propertyId}/rooms/${unit.id}`}
            id={`book-unit-btn-${unit.id}`}
            className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              unit.isBookable
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {unit.isBookable ? 'View & Book' : 'View Room'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
