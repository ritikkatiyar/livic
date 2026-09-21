import { useState, useEffect, useCallback, useMemo } from 'react';
import { getIssues, IssueResponse } from '../api/issues.api';

export function useIssues(token: string | null) {
  const [issues, setIssues] = useState<IssueResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [propertyFilter, setPropertyFilter] = useState<string | null>(null);
  const [blockFilter, setBlockFilter] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await getIssues(token, page, 20, blockFilter);
      setIssues(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load issues');
    } finally {
      setIsLoading(false);
    }
  }, [token, page, blockFilter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Clientside filtering & search on fetched page for immediate responsive feedback
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // 0. Property Match
      if (propertyFilter && issue.propertyId !== propertyFilter) {
        return false;
      }

      // 0b. Block Match
      if (blockFilter && issue.blockId && issue.blockId !== blockFilter) {
        return false;
      }

      // 1. Search Query Match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const ticketNum = (issue.ticketNumber || '').toLowerCase();
        const title = (issue.title || '').toLowerCase();
        const desc = (issue.description || '').toLowerCase();
        
        const matchesSearch = ticketNum.includes(q) || title.includes(q) || desc.includes(q);
        if (!matchesSearch) return false;
      }

      // 2. Status Match
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ESCALATED') {
          if (issue.escalationStatus !== 'ESCALATED') return false;
        } else if (issue.status !== statusFilter) {
          return false;
        }
      }

      // 3. Priority Match
      if (priorityFilter !== 'ALL' && issue.priority !== priorityFilter) {
        return false;
      }

      // 4. Category Match
      if (categoryFilter !== 'ALL' && issue.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [issues, propertyFilter, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  // Summary counts for metrics dashboard (scoped to current property selection if active)
  const metrics = useMemo(() => {
    const scopedIssues = propertyFilter 
      ? issues.filter(i => i.propertyId === propertyFilter) 
      : issues;

    const total = scopedIssues.length;
    const open = scopedIssues.filter(i => i.status === 'OPEN').length;
    const inProgress = scopedIssues.filter(i => i.status === 'IN_PROGRESS').length;
    const escalated = scopedIssues.filter(i => i.escalationStatus === 'ESCALATED').length;
    const resolved = scopedIssues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;

    return { total, open, inProgress, escalated, resolved };
  }, [issues, propertyFilter, blockFilter]);

  return {
    issues: filteredIssues,
    rawIssues: issues,
    isLoading,
    error,
    page,
    setPage,
    totalPages,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    categoryFilter,
    setCategoryFilter,
    propertyFilter,
    setPropertyFilter,
    blockFilter,
    setBlockFilter,
    metrics,
    refresh: fetchIssues
  };
}
