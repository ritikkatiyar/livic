import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import {
  addTourBlackout,
  CreateBlackoutRequest,
  deleteTourBlackout,
  getTourAvailability,
  getTourSlotsPreview,
  TourAvailability,
  TourSlots,
  updateTourAvailability,
  UpdateTourAvailabilityRequest,
} from '../api/tourAvailability.api';
import { tourRequestKeys } from './useTourRequests';

export const tourAvailabilityKeys = {
  all: ['tourAvailability'] as const,
  detail: (propertyId: string | null) => ['tourAvailability', 'detail', propertyId] as const,
  preview: (propertyId: string | null) => ['tourAvailability', 'preview', propertyId] as const,
};

/** The property's visiting hours (defaults when not customized). */
export function useTourAvailabilityQuery(propertyId: string | null) {
  const { accessToken } = useAuth();
  return useQuery<TourAvailability, Error>({
    queryKey: tourAvailabilityKeys.detail(propertyId),
    queryFn: () => getTourAvailability(propertyId as string, accessToken as string),
    enabled: Boolean(propertyId && accessToken),
    staleTime: 60 * 1000,
  });
}

/** Visiting hours with save, blocked-date actions and a preview of the slots visitors see. */
export function useTourAvailability(propertyId: string | null) {
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const availabilityQuery = useTourAvailabilityQuery(propertyId);

  const previewQuery = useQuery<TourSlots, Error>({
    queryKey: tourAvailabilityKeys.preview(propertyId),
    queryFn: () => getTourSlotsPreview(propertyId as string),
    enabled: Boolean(propertyId),
  });

  const refreshDerived = () => {
    queryClient.invalidateQueries({ queryKey: tourAvailabilityKeys.preview(propertyId) });
    // Existing requests may now be flagged as outside the visiting hours
    queryClient.invalidateQueries({ queryKey: tourRequestKeys.all });
  };

  const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

  const saveMutation = useMutation({
    mutationFn: (request: UpdateTourAvailabilityRequest) => updateTourAvailability(propertyId as string, request, accessToken as string),
    onSuccess: (saved) => {
      queryClient.setQueryData(tourAvailabilityKeys.detail(propertyId), saved);
      refreshDerived();
      showToast('Visiting hours saved', 'success');
    },
    onError: (error) => showToast(errorMessage(error, 'Could not save visiting hours'), 'error'),
  });

  const addBlackoutMutation = useMutation({
    mutationFn: (request: CreateBlackoutRequest) => addTourBlackout(propertyId as string, request, accessToken as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tourAvailabilityKeys.detail(propertyId) });
      refreshDerived();
      showToast('Date blocked for visits', 'success');
    },
    onError: (error) => showToast(errorMessage(error, 'Could not block this date'), 'error'),
  });

  const deleteBlackoutMutation = useMutation({
    mutationFn: (blackoutId: string) => deleteTourBlackout(blackoutId, accessToken as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tourAvailabilityKeys.detail(propertyId) });
      refreshDerived();
      showToast('Blocked date removed', 'success');
    },
    onError: (error) => showToast(errorMessage(error, 'Could not remove the blocked date'), 'error'),
  });

  return {
    availability: availabilityQuery.data ?? null,
    isLoading: availabilityQuery.isLoading,
    error: availabilityQuery.error,
    refetch: availabilityQuery.refetch,

    preview: previewQuery.data ?? null,
    isPreviewLoading: previewQuery.isLoading,

    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,

    addBlackout: addBlackoutMutation.mutateAsync,
    isAddingBlackout: addBlackoutMutation.isPending,

    deleteBlackout: deleteBlackoutMutation.mutate,
    deletingBlackoutId: deleteBlackoutMutation.isPending ? deleteBlackoutMutation.variables ?? null : null,
  };
}
