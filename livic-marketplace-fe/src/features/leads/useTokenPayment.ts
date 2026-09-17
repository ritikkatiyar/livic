'use client';

import { useCallback, useState } from 'react';
import { getLeadStatus, initiateTokenPayment } from '@/api/marketplace';
import { LeadResponse } from '@/types/lead';
import { getErrorMessage } from '@/utils/errors';

export function useTokenPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<
    'IDLE' | 'PAYING' | 'POLLING' | 'CONFIRMED' | 'UNCONFIRMED_RECEIVED' | 'FAILED'
  >('IDLE');
  const [leadStatus, setLeadStatus] = useState<LeadResponse | null>(null);

  const pollStatus = useCallback(async (leadId: string): Promise<LeadResponse | null> => {
    setPollingStatus('POLLING');
    let attempts = 0;
    const maxAttempts = 5;
    const intervalMs = 2000;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const res = await getLeadStatus(leadId);
        if (res.success && res.data) {
          setLeadStatus(res.data);
          if (res.data.status === 'CONFIRMED') {
            setPollingStatus('CONFIRMED');
            return res.data;
          }
        }
      } catch {
        // ignore single poll error, retry until maxAttempts
      }
      if (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, intervalMs));
      }
    }

    setPollingStatus('UNCONFIRMED_RECEIVED');
    return null;
  }, []);

  const handlePayment = useCallback(
    async (lead: LeadResponse) => {
      setLoading(true);
      setError(null);
      setPollingStatus('PAYING');

      try {
        const res = await initiateTokenPayment(lead.id);
        if (!res.success || !res.data) {
          setError(res.error?.message || 'Failed to initiate payment');
          setPollingStatus('FAILED');
          setLoading(false);
          return;
        }

        const order = res.data;
        const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false';

        if (useMock) {
          // Stub Razorpay checkout in mock mode with a small fake delay
          await new Promise((r) => setTimeout(r, 800));
          setLoading(false);
          await pollStatus(lead.id);
          return;
        }

        // Live Razorpay Script Checkout
        if (typeof window !== 'undefined') {
          // Check if Razorpay script exists, if not dynamically append
          if (!window.Razorpay) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);
            await new Promise((resolve) => {
              script.onload = resolve;
            });
          }

          const options = {
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            name: 'Livic Marketplace',
            description: `Refundable Token Payment for Booking`,
            order_id: order.orderId,
            handler: async function () {
              setLoading(false);
              await pollStatus(lead.id);
            },
            modal: {
              ondismiss: function () {
                setLoading(false);
                setPollingStatus('IDLE');
                setError('Payment process was cancelled. You can retry anytime.');
              },
            },
            theme: {
              color: '#4F46E5',
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      } catch (err) {
        setError(getErrorMessage(err));
        setPollingStatus('FAILED');
        setLoading(false);
      }
    },
    [pollStatus]
  );

  return { handlePayment, loading, error, pollingStatus, leadStatus };
}

// Window typing for Razorpay
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}
