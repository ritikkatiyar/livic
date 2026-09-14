import { useCallback, useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import { ApiError } from '@/src/utils/errors';
import {
  approveTourRequest,
  getTourRequestSummary,
  listTourRequests,
  rejectTourRequest,
  TourRequestFilter,
  TourRequestPage,
  TourRequestSummary,
} from '../api/tourRequest.api';

export const tourRequestKeys = {
  all: ['tourRequests'] as const,
  list: (propertyId: string | null, filter: TourRequestFilter, page: number) =>
    ['tourRequests', 'list', propertyId, filter, page] as const,
  summary: (propertyId: string | null) => ['tourRequests', 'summary', propertyId] as const,
};

/** Pending / upcoming counts for the tab badge; shared with {@link useTourRequests} through the query cache. */
export function useTourRequestSummary(propertyId: string | null) {
  const { accessToken } = useAuth();
  return useQuery<TourRequestSummary, Error>({
    queryKey: tourRequestKeys.summary(propertyId),
    queryFn: () => getTourRequestSummary(propertyId as string, accessToken as string),
    enabled: Boolean(propertyId && accessToken),
    staleTime: 30 * 1000,
  });
}

/** Tour requests for one property with filter + pagination, and approve / reject actions. */
export function useTourRequests(propertyId: string | null) {
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [filter, setFilterState] = useState<TourRequestFilter>('PENDING');
  const [page, setPage] = useState(0);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // A different property or filter starts from the first page
  useEffect(() => {
    setPage(0);
  }, [propertyId]);

  const setFilter = useCallback((next: TourRequestFilter) => {
    setFilterState(next);
    setPage(0);
  }, []);

  const listQuery = useQuery<TourRequestPage, Error>({
    queryKey: tourRequestKeys.list(propertyId, filter, page),
    queryFn: () => listTourRequests(propertyId as string, filter, page, accessToken as string),
    enabled: Boolean(propertyId && accessToken),
    placeholderData: keepPreviousData,
  });

  const summaryQuery = useTourRequestSummary(propertyId);

  const refreshAll = useCallback(
    () => queryClient.invalidateQueries({ queryKey: tourRequestKeys.all }),
    [queryClient]
  );

  const handleDecisionError = useCallback(
    (error: unknown, fallback: string) => {
      if (error instanceof ApiError && error.status === 409) {
        // Already decided, cancelled by the prospect, or visit time passed: show the server's reason and resync
        showToast(error.message, 'warning');
        refreshAll();
        return;
      }
      showToast(error instanceof Error && error.message ? error.message : fallback, 'error');
    },
    [refreshAll, showToast]
  );

  const approveMutation = useMutation({
    mutationFn: (leadId: string) => approveTourRequest(leadId, accessToken as string),
    onSuccess: (tour) => {
      showToast(`Tour approved for ${tour.prospectName}`, 'success');
      refreshAll();
    },
    onError: (error) => handleDecisionError(error, 'Could not approve the tour request'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ leadId, note }: { leadId: string; note: string | null }) =>
      rejectTourRequest(leadId, note, accessToken as string),
    onSuccess: (tour) => {
      setRejectingId(null);
      showToast(`Tour request from ${tour.prospectName} declined`, 'success');
      refreshAll();
    },
    onError: (error) => {
      setRejectingId(null);
      handleDecisionError(error, 'Could not reject the tour request');
    },
  });

  return {
    filter,
    setFilter,
    page,
    setPage,
    tourRequests: listQuery.data?.content ?? [],
    totalPages: listQuery.data?.totalPages ?? 0,
    totalElements: listQuery.data?.totalElements ?? 0,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    error: listQuery.error,
    refetch: refreshAll,
    summary: summaryQuery.data ?? { pending: 0, upcoming: 0 },

    approve: approveMutation.mutate,
    approvingId: approveMutation.isPending ? approveMutation.variables ?? null : null,

    rejectingId,
    openReject: setRejectingId,
    closeReject: () => setRejectingId(null),
    reject: (note: string | null) => {
      if (rejectingId) rejectMutation.mutate({ leadId: rejectingId, note });
    },
    isRejecting: rejectMutation.isPending,
  };
}
