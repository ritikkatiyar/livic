'use client';

import React, { useState } from 'react';
import { Search, RotateCcw, Filter, SlidersHorizontal } from 'lucide-react';
import { useSearchFilters } from '@/features/search/useSearchFilters';
import { PropertyType } from '@/types/property';

const PROPERTY_TYPES: { type: PropertyType; label: string }[] = [
  { type: 'RENTAL', label: 'Rentals' },
  { type: 'HOSTEL', label: 'Hostels / PG' },
  { type: 'SOCIETY', label: 'Societies' },
  { type: 'MESS', label: 'Mess / Dining' },
  { type: 'INDIVIDUAL', label: 'Houses' },
];

export function SearchFilters() {
  const { filters, updateFilters, resetFilters, isPending } = useSearchFilters();
  const [cityInput, setCityInput] = useState(filters.city || '');
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice?.toString() || '');
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice?.toString() || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({
      city: cityInput.trim(),
      minPrice: minPriceInput ? Number(minPriceInput) : undefined,
      maxPrice: maxPriceInput ? Number(maxPriceInput) : undefined,
    });
  };

  const togglePropertyType = (type: PropertyType) => {
    const currentTypes = filters.propertyType || [];
    const exists = currentTypes.includes(type);
    const updated = exists ? currentTypes.filter((t) => t !== type) : [...currentTypes, type];
    updateFilters({ propertyType: updated });
  };

  const handleReset = () => {
    setCityInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    resetFilters();
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 mb-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
      {/* Primary Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            id="city-search-input"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Search by city or locality (e.g. Bengaluru, Koramangala, Powai)..."
            className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            id="search-submit-btn"
            className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Filter className="h-4 w-4" />
            <span>{isPending ? 'Searching...' : 'Search'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-3 rounded-xl glass-card text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white text-sm font-medium flex items-center gap-2 border border-slate-200 dark:border-slate-700"
            id="toggle-advanced-filters"
          >
            <SlidersHorizontal className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            <span className="hidden md:inline">Filters</span>
          </button>
        </div>
      </form>

      {/* Filter Chips: Property Types */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/60">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-2">
          Type:
        </span>
        {PROPERTY_TYPES.map(({ type, label }) => {
          const isSelected = (filters.propertyType || []).includes(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => togglePropertyType(type)}
              id={`filter-type-${type}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {label}
            </button>
          );
        })}

        {(filters.city || (filters.propertyType && filters.propertyType.length > 0) || filters.minPrice || filters.maxPrice) && (
          <button
            type="button"
            onClick={handleReset}
            id="reset-filters-btn"
            className="ml-auto text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800/40"
          >
            <RotateCcw className="h-3 w-3" /> Clear All
          </button>
        )}
      </div>

      {/* Advanced Price Filters */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
          <div>
            <label htmlFor="min-price-input" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Min Rent (₹)
            </label>
            <input
              type="number"
              id="min-price-input"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full px-3 py-2 rounded-lg glass-input text-xs"
            />
          </div>
          <div>
            <label htmlFor="max-price-input" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Max Rent (₹)
            </label>
            <input
              type="number"
              id="max-price-input"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              placeholder="e.g. 30000"
              className="w-full px-3 py-2 rounded-lg glass-input text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}
