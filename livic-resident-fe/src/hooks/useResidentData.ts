import { useQuery } from '@tanstack/react-query';
import { getMyContext } from '@/src/features/auth/api/me.api';
import { getAnnouncements, Announcement } from '@/src/features/announcements/api/announcement.api';
import { getActiveLease, LeaseResponse } from '@/src/features/tenant/api/lease.api';
import { getPropertyDetails, PropertyDetailsResponse } from '@/src/features/property/api/property.api';

export function useResidentContext(token: string) {
  return useQuery({
    queryKey: ['residentContext', token],
    queryFn: async () => {
      if (!token) return { activeLeases: [] };
      return getMyContext(token);
    },
    enabled: !!token,
  });
}

export function useAnnouncements(token: string) {
  return useQuery<Announcement[], Error>({
    queryKey: ['announcements', token],
    queryFn: async () => {
      if (!token) return [];
      return getAnnouncements(token);
    },
    enabled: !!token,
  });
}

export function useActiveLease(token: string) {
  return useQuery<LeaseResponse | null, Error>({
    queryKey: ['activeLease', token],
    queryFn: async () => {
      if (!token) return null;
      return getActiveLease(token);
    },
    enabled: !!token,
  });
}

export function usePropertyDetails(propertyId: string | undefined, token: string) {
  return useQuery<PropertyDetailsResponse | null, Error>({
    queryKey: ['propertyDetails', propertyId, token],
    queryFn: async () => {
      if (!propertyId || !token) return null;
      return getPropertyDetails(propertyId, token);
    },
    enabled: !!propertyId && !!token,
  });
}

