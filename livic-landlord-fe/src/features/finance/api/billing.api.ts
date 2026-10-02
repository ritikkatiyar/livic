import { apiRequest } from '@/src/api/client';
import type { ApiInput, ApiModel } from '@/src/api/models';

export type FeatureDisplayItem = ApiModel<'FeatureDisplayItem'>;

export type PlanResponse = ApiModel<'PlanResponse'>;

export type SubscriptionDetails = ApiModel<'SubscriptionDetailsDto', 'price' | 'gatewaySubscriptionId'>;

export type WalletDetails = ApiModel<'WalletDetailsDto', 'lastToppedUp'>;

export type BillingStatusResponse = ApiModel<'BillingStatusResponse'>;

export type SubscribeRequestPayload = ApiInput<'SubscriptionRequest'>;

export type TopUpRequestPayload = {
  amount: number;
  gateway?: 'RAZORPAY' | 'STRIPE' | 'PAYPAL';
};

export type SubscriptionResponse = {
  transactionId: string;
  gatewayName: string;
  gatewayTransactionId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  createdAt: string;
};

export type PaymentIntentResponse = ApiModel<'PaymentIntentResponse', 'clientSecret' | 'paymentUrl'>;

export function getPlans(token?: string): Promise<PlanResponse[]> {
  return apiRequest<PlanResponse[]>('/api/v1/billing/plans', {
    method: 'GET',
    token,
  });
}

export function getBillingStatus(token: string): Promise<BillingStatusResponse> {
  return apiRequest<BillingStatusResponse>('/api/v1/billing/status', {
    method: 'GET',
    token,
  });
}

export function subscribeToPlan(payload: SubscribeRequestPayload, token: string): Promise<SubscriptionResponse> {
  return apiRequest<SubscriptionResponse>('/api/v1/billing/subscribe', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function topUpWallet(payload: TopUpRequestPayload, token: string): Promise<PaymentIntentResponse> {
  return apiRequest<PaymentIntentResponse>('/api/v1/billing/topup', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export type PaymentVerificationPayload = ApiInput<'PaymentVerificationRequest'>;

export function verifyPayment(payload: PaymentVerificationPayload, token: string): Promise<string> {
  return apiRequest<string>('/api/v1/payments/verify', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}
