import { useQuery } from '@tanstack/react-query';
import { getIssues } from '../api/issues.api';

// Enough to count what needs attention; the tab badge shows 9+ beyond nine anyway
const PAGE_SIZE = 100;

export interface IssueAttention {
  /** Open or escalated: the Issues tab badge. */
  attention: number;
}

/** What is waiting on the landlord in Issues: the Issues tab badge. */
export function useIssueAttention(token: string | null): IssueAttention {
  const { data } = useQuery({
    queryKey: ['issueAttention', token],
    queryFn: async (): Promise<IssueAttention> => {
      const issues = (await getIssues(token as string, 0, PAGE_SIZE)).content ?? [];
      const attention = issues.filter((issue) => issue.status === 'OPEN' || issue.escalationStatus === 'ESCALATED').length;
      return { attention };
    },
    enabled: !!token,
    staleTime: 60_000,
  });
  return data ?? { attention: 0 };
}
