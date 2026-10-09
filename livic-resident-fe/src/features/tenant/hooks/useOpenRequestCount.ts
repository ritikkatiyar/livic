import { useQuery } from '@tanstack/react-query';
import { getMaintenanceTickets } from '../api/maintenance.api';

const CLOSED_STATUSES = new Set(['RESOLVED', 'CLOSED']);

/** The resident's requests still being worked on. Shown as the Requests tab badge. */
export function useOpenRequestCount(token: string | null) {
  const { data } = useQuery({
    queryKey: ['openRequestCount', token],
    queryFn: async () => {
      const tickets = await getMaintenanceTickets(token as string);
      return tickets.filter((ticket) => !CLOSED_STATUSES.has(String(ticket.status))).length;
    },
    enabled: !!token,
    staleTime: 60_000,
  });
  return data ?? 0;
}
