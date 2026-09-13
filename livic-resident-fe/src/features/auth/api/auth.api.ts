import { apiRequest } from '@/src/api/client';
import type {
  LoginRequest,
  LogoutRequest,
  OAuthLoginRequest,
  RefreshRequest,
  ResendVerificationRequest,
  SignupRequest,
  SignupResponse,
  TokenBundle,
  VerifyEmailRequest,
} from '@/src/types/auth';

export function login(payload: LoginRequest): Promise<TokenBundle> {
  return apiRequest<TokenBundle>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function signup(payload: SignupRequest): Promise<SignupResponse> {
  return apiRequest<SignupResponse>('/api/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function verifyEmail(payload: VerifyEmailRequest): Promise<TokenBundle> {
  return apiRequest<TokenBundle>('/api/v1/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function resendVerification(payload: ResendVerificationRequest): Promise<void> {
  return apiRequest<void>('/api/v1/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function oauthLogin(provider: 'google', payload: OAuthLoginRequest): Promise<TokenBundle> {
  return apiRequest<TokenBundle>(`/api/v1/auth/oauth/${provider}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function refresh(payload: RefreshRequest): Promise<TokenBundle> {
  return apiRequest<TokenBundle>('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logout(payload: LogoutRequest): Promise<void> {
  return apiRequest<void>('/api/v1/auth/logout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
