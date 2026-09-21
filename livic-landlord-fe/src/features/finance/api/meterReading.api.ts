import { apiRequest } from '@/src/api/client';

export interface MeterReadingResponse {
    id: string;
    unitId: string;
    blockId?: string | null;
    blockName?: string | null;
    unitName: string;
    tenantName: string;
    floor: number;
    previousReading: number;
    currentReading: number | null;
    isBilled: boolean;
}

export interface UnitReading {
    unitId: string;
    previousReading?: number | null;
    currentReading: number | null;
}

export interface MeterReadingRequest {
    propertyId: string;
    chargeConfigId: string;
    billingMonth: number;
    billingYear: number;
    readings: UnitReading[];
}

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
