import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { PropertySummary } from '@/types/property';
import { PropertyTypeBadge } from '../ui/Badge';
import { formatCurrency } from '@/utils/formatCurrency';

export function PropertyCard({ property }: { property: PropertySummary }) {
  return (
    <Link
      href={`/market-place/${property.id}`}
      className="group block glass-card rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
      aria-label={`View details for ${property.name} in ${property.city}`}
      id={`property-card-${property.id}`}
    >
      {/* Cover Image Container */}
      <div className="relative h-52 w-full overflow-hidden bg-slate-900">
        {property.coverImageUrl ? (
          <Image
            src={property.coverImageUrl}
            alt={`Cover photo of ${property.name}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400 bg-slate-800">
            No Image Available
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-90" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <PropertyTypeBadge type={property.propertyType} />
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-950/80 text-amber-300 border border-amber-500/30 backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-amber-400" /> Verified
          </span>
        </div>

        {/* City & Landmark Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 text-xs text-slate-100 font-semibold drop-shadow-sm">
          <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">
            {property.landmark ? `${property.landmark}, ${property.city}` : property.city}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors line-clamp-1">
          {property.name}
        </h3>

        <div className="flex items-end justify-between pt-3 border-t border-slate-200 dark:border-slate-800/80">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Starting from</span>
            <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-300 tracking-tight">
              {formatCurrency(property.startingPrice, true)}
            </span>
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors">
            View Details <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}
