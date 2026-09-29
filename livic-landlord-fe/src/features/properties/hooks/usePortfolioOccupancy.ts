import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { getPortfolioOccupancy, PortfolioOccupancyResponse } from '@/src/features/analytics/api/analytics.api';

const MAX_PROPERTIES = 200;

/**
 * Occupancy for every property in one request, shared by all property cards
 * (instead of each card loading its full unit layout).
 */
export function usePortfolioOccupancy() {
  const { user, accessToken } = useAuth();

  return useQuery<Record<string, PortfolioOccupancyResponse>>({
    queryKey: ['portfolio-occupancy', user?.id],
    queryFn: async () => {
      const rows = await getPortfolioOccupancy(accessToken!, 0, MAX_PROPERTIES);
      return Object.fromEntries(rows.map((row) => [row.propertyId, row]));
    },
    enabled: Boolean(user?.id && accessToken),
    staleTime: 1000 * 60 * 2,
  });
}
