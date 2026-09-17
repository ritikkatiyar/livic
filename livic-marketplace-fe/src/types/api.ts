export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error?: { code: string; message: string };
  correlationId?: string;
};

export type PagedResult<T> = {
  items: T[];
  page: number; // 1-based
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
