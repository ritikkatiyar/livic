import { useQuery } from '@tanstack/react-query';
import { getAnnouncements } from '../api/announcement.api';

/** Cache key; invalidate it after marking a notice read so the bell clears straight away. */
export const UNREAD_NOTICES_KEY = 'unreadNotices';

/** Notices the resident hasn't read yet. Lights the bell. */
export function useUnreadNoticeCount(token: string | null) {
  const { data } = useQuery({
    queryKey: [UNREAD_NOTICES_KEY, token],
    queryFn: async () => (await getAnnouncements(token as string)).filter((notice) => !notice.read).length,
    enabled: !!token,
    staleTime: 60_000,
  });
  return data ?? 0;
}
