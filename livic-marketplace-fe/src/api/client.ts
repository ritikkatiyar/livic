import { ApiResponse } from '@/types/api';

export class ApiError extends Error {
  code: string;
  correlationId?: string;

  constructor(message: string, code: string = 'API_ERROR', correlationId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.correlationId = correlationId;
  }
}

export type RequestOptions = RequestInit & {
  otpSessionToken?: string;
  timeoutMs?: number;
};

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.livic.app/api/v1';

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'corr-' + Math.random().toString(36).substring(2, 11);
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { otpSessionToken, timeoutMs = 15000, headers: customHeaders, ...restOptions } = options;
  const correlationId = generateCorrelationId();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const url = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Correlation-Id': correlationId,
    ...(otpSessionToken ? { 'X-OTP-Session-Token': otpSessionToken } : {}),
    ...(customHeaders as Record<string, string>),
  };

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody: { code?: string; message?: string } = {};
      try {
        const parsed = await response.json();
        errorBody = parsed.error || parsed;
      } catch {
        errorBody = { message: `HTTP Error ${response.status}: ${response.statusText}` };
      }

      throw new ApiError(
        errorBody.message || 'An unexpected error occurred',
        errorBody.code || `HTTP_${response.status}`,
        correlationId
      );
    }

    const data: ApiResponse<T> = await response.json();
    return {
      ...data,
      correlationId: data.correlationId || correlationId,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }

    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('Request timed out', 'TIMEOUT_ERROR', correlationId);
    }

    throw new ApiError(
      err instanceof Error ? err.message : 'Network request failed',
      'NETWORK_ERROR',
      correlationId
    );
  }
}
