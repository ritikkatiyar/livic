'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { PropertySearchFilters, PropertyType } from '@/types/property';

export function useSearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const city = searchParams.get('city') || '';
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const typesRaw = searchParams.get('type');
  const propertyType: PropertyType[] = typesRaw ? (typesRaw.split(',') as PropertyType[]) : [];
  const availableFrom = searchParams.get('availableFrom') || '';

  const updateFilters = useCallback(
    (newFilters: Partial<PropertySearchFilters>) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newFilters.city !== undefined) {
        if (newFilters.city) params.set('city', newFilters.city);
        else params.delete('city');
      }

      if (newFilters.minPrice !== undefined) {
        if (newFilters.minPrice !== undefined && newFilters.minPrice > 0)
          params.set('minPrice', newFilters.minPrice.toString());
        else params.delete('minPrice');
      }

      if (newFilters.maxPrice !== undefined) {
        if (newFilters.maxPrice !== undefined && newFilters.maxPrice > 0)
          params.set('maxPrice', newFilters.maxPrice.toString());
        else params.delete('maxPrice');
      }

      if (newFilters.propertyType !== undefined) {
        if (newFilters.propertyType.length > 0)
          params.set('type', newFilters.propertyType.join(','));
        else params.delete('type');
      }

      if (newFilters.availableFrom !== undefined) {
        if (newFilters.availableFrom) params.set('availableFrom', newFilters.availableFrom);
        else params.delete('availableFrom');
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router]
  );

  const resetFilters = useCallback(() => {
    startTransition(() => {
      router.push(pathname);
    });
  }, [pathname, router]);

  const currentFilters: PropertySearchFilters = {
    city,
    minPrice,
    maxPrice,
    propertyType,
    availableFrom,
  };

  return {
    filters: currentFilters,
    updateFilters,
    resetFilters,
    isPending,
  };
}
