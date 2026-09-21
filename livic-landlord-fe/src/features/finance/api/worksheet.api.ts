import { apiRequest } from '@/src/api/client';

export interface WorksheetEntryResponse {
  id: string;
  unitId: string;
  blockId?: string | null;
  blockName?: string | null;
  unitName: string;
  tenantName: string;
  floor: number;
  enteredValue: number;
  isBilled: boolean;
}

export interface UnitEntry {
  unitId: string;
  enteredValue: number;
}

export interface WorksheetSaveRequest {
  propertyId: string;
  chargeConfigId: string;
  billingMonth: string;
  entries: UnitEntry[];
}

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
