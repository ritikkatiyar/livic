import { ApiResponse } from '@/types/api';

export class ApiError extends Error {
  code: string;
  correlationId?: string;
  /** HTTP status, when the server answered. */
  status?: number;
  /** Parsed error body, for callers that need extra fields (e.g. `existingRequest` on a 409). */
  details?: unknown;

  constructor(message: string, code: string = 'API_ERROR', correlationId?: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.correlationId = correlationId;
    this.status = status;
    this.details = details;
  }
}

export type RequestOptions = RequestInit & {
  otpSessionToken?: string;
  timeoutMs?: number;
};

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.livic.app/api/v1';

type BackendErrorBody = {
  message?: unknown;
  code?: unknown;
  error?: unknown;
  fieldErrors?: { field?: string; message?: string }[];
};

/**
 * Extracts a user-facing message from an error response. Handles the backend's
 * `{ status, error, message, fieldErrors }` shape as well as `{ error: { code, message } }` / `{ error: "..." }`.
 */
export function parseErrorBody(parsed: unknown): { code?: string; message?: string } {
  if (!parsed || typeof parsed !== 'object') return {};
  const body = parsed as BackendErrorBody;

  if (body.error && typeof body.error === 'object') {
    const nested = body.error as { code?: unknown; message?: unknown };
    return {
      code: typeof nested.code === 'string' ? nested.code : undefined,
      message: typeof nested.message === 'string' ? nested.message : undefined,
    };
  }

  const fieldMessage = body.fieldErrors?.find((f) => f?.message)?.message;
  const message =
    fieldMessage ||
    (typeof body.message === 'string' ? body.message : undefined) ||
    (typeof body.error === 'string' ? body.error : undefined);

  return { code: typeof body.code === 'string' ? body.code : undefined, message };
}

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
      let rawBody: unknown;
      try {
        rawBody = await response.json();
        errorBody = parseErrorBody(rawBody);
      } catch {
        errorBody = { message: `HTTP Error ${response.status}: ${response.statusText}` };
      }

      throw new ApiError(
        errorBody.message || 'An unexpected error occurred',
        errorBody.code || `HTTP_${response.status}`,
        correlationId,
        response.status,
        rawBody
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
