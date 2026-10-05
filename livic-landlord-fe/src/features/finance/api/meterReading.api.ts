import { apiRequest } from '@/src/api/client';
import type { ApiInput, ApiModel } from '@/src/api/models';

export type MeterReadingResponse = ApiModel<'MeterReadingResponse', 'blockId' | 'blockName', 'blockId' | 'blockName' | 'currentReading'>;

export type UnitReading = ApiModel<'UnitReading', 'previousReading', 'previousReading' | 'currentReading'>;

export type MeterReadingRequest = ApiInput<'MeterReadingRequest'>;

export const getWorksheet = async (
    propertyId: string,
    chargeConfigId: string,
    month: number,
    year: number,
    token: string,
    blockId?: string | null
): Promise<MeterReadingResponse[]> => {
    let url = `/api/v1/finance/meter-readings/worksheet?propertyId=${propertyId}&chargeConfigId=${chargeConfigId}&month=${month}&year=${year}`;
    if (blockId) url += `&blockId=${blockId}`;
    return apiRequest<MeterReadingResponse[]>(url, {
        method: 'GET',
        token
    });
};

export const batchSaveReadings = async (request: MeterReadingRequest, token: string): Promise<void> => {
    return apiRequest<void>('/api/v1/finance/meter-readings/batch-save', {
        method: 'POST',
        token,
        body: JSON.stringify(request)
    });
};
