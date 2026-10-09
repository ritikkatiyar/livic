import { useQuery } from '@tanstack/react-query';
import { getMyMessMenu, MessMenu } from '../api/messMenu.api';

export const myMessMenuKey = (token: string) => ['myMessMenu', token] as const;

/** The resident's weekly mess menu, shared by the menu screen, the home card and the navigation. */
export function useMyMessMenu(token: string) {
  return useQuery<MessMenu, Error>({
    queryKey: myMessMenuKey(token),
    queryFn: () => getMyMessMenu(token),
    enabled: Boolean(token),
  });
}
