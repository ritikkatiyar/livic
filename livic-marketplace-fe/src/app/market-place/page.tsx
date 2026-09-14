import { Metadata } from 'next';
import { SearchFilters } from '@/components/search/SearchFilters';
import { PropertyGridWrapper } from '@/components/search/PropertyGridWrapper';

export const metadata: Metadata = {
  title: 'Explore Rental Homes, Hostels & Societies | Livic Marketplace',
  description:
    'Discover verified rental apartments, co-living hostels, and gated society flats across Bengaluru, Mumbai, Gurugram, and Pune. Zero brokerage with instant tour booking.',
  openGraph: {
    title: 'Explore Rental Homes & Hostels | Livic Marketplace',
    description: 'Zero brokerage, 100% verified properties with refundable token bookings.',
  },
};

export default function MarketplacePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Header */}
      <div className="mb-8 space-y-3 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-800 dark:from-white dark:via-slate-100 dark:to-indigo-200 bg-clip-text text-transparent">
          Find Your Next Dream Stay
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
          Browse verified rental flats, co-living hostels, and independent residences. Transparent prices with direct tour scheduling.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <SearchFilters />

      {/* Dynamic Results Grid */}
      <PropertyGridWrapper />
    </div>
  );
}
