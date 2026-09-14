'use client';

import { useSearchFilters } from '@/features/search/useSearchFilters';
import { useSearchResults } from '@/features/search/useSearchResults';
import { PropertyGrid } from './PropertyGrid';

export function PropertyGridWrapper() {
  const { filters } = useSearchFilters();
  const { properties, loading, error } = useSearchResults(filters);

  return <PropertyGrid properties={properties} loading={loading} error={error} />;
}
