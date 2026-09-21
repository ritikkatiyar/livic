import { useQuery, useMutation } from '@tanstack/react-query';
import { getActiveChargesForProperty } from '@/src/features/finance/api/charge.api';
import { getOrCreateWorksheet, batchSaveWorksheet } from '@/src/features/finance/api/worksheet.api';

export function useBillingWorksheet(
  propertyId: string | null,
  selectedChargeId: string | null,
  billingMonth: string,
  token: string | null,
  blockId?: string | null
) {
  const { data: charges = [], isLoading: isLoadingCharges } = useQuery({
    queryKey: ['propertyCharges', propertyId],
    queryFn: () => getActiveChargesForProperty(propertyId!, token!),
    enabled: !!propertyId && !!token,
  });

  const { data: entries = [], isLoading: isLoadingWorksheet, refetch: refetchWorksheet } = useQuery({
    queryKey: ['worksheetEntries', propertyId, selectedChargeId, billingMonth, blockId],
    queryFn: () => getOrCreateWorksheet(propertyId!, selectedChargeId!, billingMonth, token!, blockId),
    enabled: !!propertyId && !!selectedChargeId && !!billingMonth && !!token,
  });

  const saveMutation = useMutation({
    mutationFn: (payloadEntries: { unitId: string; enteredValue: number }[]) =>
      batchSaveWorksheet({
        propertyId: propertyId!,
        chargeConfigId: selectedChargeId!,
        billingMonth,
        entries: payloadEntries
      }, token!),
    onSuccess: () => {
      refetchWorksheet();
    }
  });

  return {
    charges,
    entries,
    isLoading: isLoadingCharges || isLoadingWorksheet,
    isSaving: saveMutation.isPending,
    saveWorksheet: saveMutation.mutateAsync,
  };
}
