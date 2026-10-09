import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import {
  getMessMenu,
  MealSlotRequest,
  MessMenu,
  updateMealSlots,
  updateMessSettings,
  updateWeekMenu,
  UpdateWeekMenuRequest,
} from '../api/messMenu.api';

export const messMenuKeys = {
  all: ['messMenu'] as const,
  detail: (propertyId: string | null) => ['messMenu', 'detail', propertyId] as const,
};

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

/** A property's weekly mess menu, with its on/off switch, meal slots and week saves. */
export function useMessMenu(propertyId: string | null) {
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const menuQuery = useQuery<MessMenu, Error>({
    queryKey: messMenuKeys.detail(propertyId),
    queryFn: () => getMessMenu(propertyId as string, accessToken as string),
    enabled: Boolean(propertyId && accessToken),
    staleTime: 60 * 1000,
  });

  // Every write returns the whole menu, so the cache is replaced rather than refetched
  const store = (menu: MessMenu) => queryClient.setQueryData(messMenuKeys.detail(propertyId), menu);

  const settingsMutation = useMutation({
    mutationFn: (enabled: boolean) => updateMessSettings(propertyId as string, enabled, accessToken as string),
    onSuccess: (menu) => {
      store(menu);
      showToast(menu.enabled ? 'Residents can now see the mess menu' : 'Mess menu hidden from residents', 'success');
    },
    onError: (error) => showToast(errorMessage(error, 'Could not change who sees the menu'), 'error'),
  });

  const slotsMutation = useMutation({
    mutationFn: (slots: MealSlotRequest[]) => updateMealSlots(propertyId as string, slots, accessToken as string),
    onSuccess: (menu) => {
      store(menu);
      showToast('Meals saved', 'success');
    },
    onError: (error) => showToast(errorMessage(error, 'Could not save the meals'), 'error'),
  });

  const weekMutation = useMutation({
    mutationFn: (request: UpdateWeekMenuRequest) => updateWeekMenu(propertyId as string, request, accessToken as string),
    onSuccess: (menu) => {
      store(menu);
      showToast('Menu saved', 'success');
    },
    onError: (error) => showToast(errorMessage(error, 'Could not save the menu'), 'error'),
  });

  return {
    menu: menuQuery.data ?? null,
    isLoading: menuQuery.isLoading,
    error: menuQuery.error,
    refetch: menuQuery.refetch,

    setEnabled: settingsMutation.mutate,
    isTogglingEnabled: settingsMutation.isPending,

    saveSlots: slotsMutation.mutateAsync,
    isSavingSlots: slotsMutation.isPending,

    saveWeek: weekMutation.mutateAsync,
    isSavingWeek: weekMutation.isPending,
  };
}
