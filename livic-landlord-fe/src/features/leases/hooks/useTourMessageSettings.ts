import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import {
  getTourMessageSettings,
  TourMessageSettings,
  updateTourMessageSettings,
  UpdateTourMessageSettingsRequest,
} from '../api/tourMessageSettings.api';

export const tourMessageSettingsKeys = {
  detail: (propertyId: string | null) => ['tourMessageSettings', propertyId] as const,
};

/** How visitors are messaged about their tours (SMS, WhatsApp, both or none), with save. */
export function useTourMessageSettings(propertyId: string | null) {
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery<TourMessageSettings, Error>({
    queryKey: tourMessageSettingsKeys.detail(propertyId),
    queryFn: () => getTourMessageSettings(propertyId as string, accessToken as string),
    enabled: Boolean(propertyId && accessToken),
    staleTime: 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: (request: UpdateTourMessageSettingsRequest) =>
      updateTourMessageSettings(propertyId as string, request, accessToken as string),
    onSuccess: (saved) => {
      queryClient.setQueryData(tourMessageSettingsKeys.detail(propertyId), saved);
      showToast('Visitor messages saved', 'success');
    },
    onError: (error) =>
      showToast(error instanceof Error && error.message ? error.message : 'Could not save visitor messages', 'error'),
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
