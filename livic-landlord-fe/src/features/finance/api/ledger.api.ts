import { apiRequest } from '@/src/api/client';
import type { ApiModel } from '@/src/api/models';

export type LedgerEntryResponse = ApiModel<'LedgerEntryResponse'>;

export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export const getLedgerForProperty = async (
  propertyId: string,
  token: string,
  page: number = 0,
  size: number = 20,
  fromDate?: string,
  toDate?: string,
  search?: string
): Promise<PaginatedResponse<LedgerEntryResponse>> => {
  let url = `/api/v1/finance/ledger?propertyId=${propertyId}&page=${page}&size=${size}`;
  if (fromDate) {
    url += `&fromDate=${encodeURIComponent(fromDate)}`;
  }
  if (toDate) {
    url += `&toDate=${encodeURIComponent(toDate)}`;
  }
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return await apiRequest<PaginatedResponse<LedgerEntryResponse>>(
    url,
    {
      method: 'GET',
      token
    }
  );
};
