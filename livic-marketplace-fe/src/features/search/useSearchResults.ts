'use client';

import { useEffect, useState } from 'react';
import { searchProperties } from '@/api/marketplace';
import { PropertySearchFilters, PropertySummary } from '@/types/property';
import { getErrorMessage } from '@/utils/errors';

export function useSearchResults(filters: PropertySearchFilters) {
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const city = filters.city;
  const minPrice = filters.minPrice;
  const maxPrice = filters.maxPrice;
  const availableFrom = filters.availableFrom;
  const propertyTypesKey = (filters.propertyType || []).join(',');

  useEffect(() => {
    let isMounted = true;

    async function fetchResults() {
      try {
        const res = await searchProperties({
          city,
          minPrice,
          maxPrice,
          availableFrom,
          propertyType: propertyTypesKey ? (propertyTypesKey.split(',') as PropertySearchFilters['propertyType']) : [],
        });
        if (!isMounted) return;
        if (res.success && res.data) {
          setProperties(res.data);
          setError(null);
        } else {
          setError(res.error?.message || 'Failed to fetch properties');
        }
      } catch (err) {
        if (!isMounted) return;
        setError(getErrorMessage(err));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchResults();

    return () => {
      isMounted = false;
    };
  }, [city, minPrice, maxPrice, availableFrom, propertyTypesKey]);

  return { properties, loading, error };
}
