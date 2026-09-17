'use client';

import { useState } from 'react';
import { Building2, Frown } from 'lucide-react';
import { PropertySummary } from '@/types/property';
import { PropertyCard } from './PropertyCard';
import { PropertyCardSkeleton } from '../ui/Skeleton';

type PropertyGridProps = {
  properties: PropertySummary[];
  loading: boolean;
  error: string | null;
};

export function PropertyGrid({ properties, loading, error }: PropertyGridProps) {
  const [displayCount, setDisplayCount] = useState(6);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="property-grid-loading">
        {Array.from({ length: 6 }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-rose-500 dark:text-rose-400 space-y-3 my-8 border-rose-500/30">
        <p className="font-semibold text-base">{error}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Please verify your search inputs or try refreshing the page.</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center space-y-4 my-8" id="empty-results-container">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          <Frown className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No properties match your filters</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Try expanding your price range or searching for a different city or locality.
        </p>
      </div>
    );
  }

  const visibleProperties = properties.slice(0, displayCount);
  const hasMore = displayCount < properties.length;

  return (
    <div className="space-y-8" id="property-grid-container">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Showing <span className="text-slate-900 dark:text-white font-bold">{properties.length}</span> verified properties
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleProperties.map((prop) => (
          <PropertyCard key={prop.id} property={prop} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => setDisplayCount((prev) => prev + 6)}
            id="load-more-btn"
            className="px-8 py-3 rounded-xl glass-card text-slate-900 dark:text-white font-semibold text-sm border border-slate-300 dark:border-slate-700 hover:border-indigo-500 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            Load More Properties
          </button>
        </div>
      )}
    </div>
  );
}
