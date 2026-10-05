import { apiRequest } from '@/src/api/client';
import type { ApiInput, ApiModel } from '@/src/api/models';

export type WorksheetEntryResponse = ApiModel<'WorksheetEntryResponse'>;

export type UnitEntry = ApiModel<'UnitEntry'>;

export type WorksheetSaveRequest = ApiInput<'WorksheetSaveRequest'>;

export const getOrCreateWorksheet = async (
  propertyId: string, 
  chargeConfigId: string, 
  billingMonth: string,
  token: string,
  blockId?: string | null
): Promise<WorksheetEntryResponse[]> => {
  const params = new URLSearchParams({
    propertyId,
    chargeConfigId,
    billingMonth,
  });
  if (blockId) params.append('blockId', blockId);
  return apiRequest<WorksheetEntryResponse[]>(
    `/api/v1/finance/billing-worksheets?${params.toString()}`,
    {
      method: 'GET',
      token
    }
  );
};

export const batchSaveWorksheet = async (
  request: WorksheetSaveRequest,
  token: string
): Promise<void> => {
  return apiRequest<void>(
    '/api/v1/finance/billing-worksheets/batch-save',
    {
      method: 'POST',
      body: JSON.stringify(request),
      token
    }
  );
};
