import { apiRequest } from '@/src/api/client';
import type { ApiInput, ApiModel } from '@/src/api/models';

export type ChargeConfigRequest = ApiInput<'ChargeConfigRequest'>;

export type ChargeConfigResponse = ApiModel<'ChargeConfigResponse', 'unitType' | 'baseRate' | 'autoCarryForward', 'baseRate' | 'lateFeePercentage'>;

export const createChargeConfig = async (request: ChargeConfigRequest, token: string): Promise<ChargeConfigResponse> => {
    return apiRequest<ChargeConfigResponse>('/api/v1/finance/charge-configs', {
        method: 'POST',
        token,
        body: JSON.stringify(request)
    });
};

export interface ChargeConfigListResponse {
    content: ChargeConfigResponse[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export const getActiveChargesForProperty = async (propertyId: string, token: string): Promise<ChargeConfigResponse[]> => {
    if (!propertyId || propertyId === 'null' || propertyId === 'undefined') {
        return [];
    }
    const response = await apiRequest<ChargeConfigListResponse>(`/api/v1/finance/charge-configs/property/${propertyId}?size=2000`, {
        method: 'GET',
        token
    });
    return response?.content || [];
};

export const getChargesForProperty = async (propertyId: string, includeInactive: boolean, token: string): Promise<ChargeConfigResponse[]> => {
    if (!propertyId || propertyId === 'null' || propertyId === 'undefined') {
        return [];
    }
    const response = await apiRequest<ChargeConfigListResponse>(`/api/v1/finance/charge-configs/property/${propertyId}?includeInactive=${includeInactive}&size=2000`, {
        method: 'GET',
        token
    });
    return response?.content || [];
};

export const deactivateChargeConfig = async (id: string, token: string): Promise<void> => {
    return apiRequest<void>(`/api/v1/finance/charge-configs/${id}`, {
        method: 'DELETE',
        token
    });
};

export const reactivateChargeConfig = async (id: string, token: string): Promise<void> => {
    return apiRequest<void>(`/api/v1/finance/charge-configs/${id}/reactivate`, {
        method: 'POST',
        token
    });
};

export const deleteChargeConfigPermanently = async (id: string, token: string): Promise<void> => {
    return apiRequest<void>(`/api/v1/finance/charge-configs/${id}/permanent`, {
        method: 'DELETE',
        token
    });
};

export const updateChargeConfig = async (id: string, request: ChargeConfigRequest, token: string): Promise<ChargeConfigResponse> => {
    return apiRequest<ChargeConfigResponse>(`/api/v1/finance/charge-configs/${id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify(request)
    });
};

export const getChargeConfigById = async (id: string, token: string): Promise<ChargeConfigResponse> => {
    return apiRequest<ChargeConfigResponse>(`/api/v1/finance/charge-configs/${id}`, {
        method: 'GET',
        token
    });
};
