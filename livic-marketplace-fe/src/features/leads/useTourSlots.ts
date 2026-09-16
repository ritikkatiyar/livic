'use client';

import { useEffect, useState } from 'react';
import { getTourSlots } from '@/api/marketplace';
import { TourSlots } from '@/types/tourSlot';
import { getErrorMessage } from '@/utils/errors';

type LoadedSlots = {
  key: string;
  data: TourSlots | null;
  error: string | null;
};

/**
 * The visit slots a property currently offers. Reloaded when the verified phone changes (so declined slots are
 * marked) and on demand after the server refuses a slot.
 */
export function useTourSlots(propertyId: string, otpSessionToken: string | null) {
  const [reloadCount, setReloadCount] = useState(0);
  const [loaded, setLoaded] = useState<LoadedSlots | null>(null);

  const requestKey = `${propertyId}:${otpSessionToken ?? 'anonymous'}:${reloadCount}`;

  useEffect(() => {
    let active = true;
    getTourSlots(propertyId, otpSessionToken).then(
      (res) => {
        if (active) setLoaded({ key: requestKey, data: res.data ?? null, error: null });
      },
      (err) => {
        if (active) setLoaded((prev) => ({ key: requestKey, data: prev?.data ?? null, error: getErrorMessage(err) }));
      }
    );
    return () => {
      active = false;
    };
  }, [propertyId, otpSessionToken, requestKey]);

  const isLoading = loaded?.key !== requestKey;

  return {
    slots: loaded?.data ?? null,
    isLoading,
    error: isLoading ? null : loaded?.error ?? null,
    reload: () => setReloadCount((c) => c + 1),
  };
}
