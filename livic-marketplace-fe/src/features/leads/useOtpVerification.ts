'use client';

import { useCallback, useEffect, useState } from 'react';
import { requestOtp, verifyOtp } from '@/api/marketplace';
import { getErrorMessage } from '@/utils/errors';

export function useOtpVerification() {
  const [phone, setPhone] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSessionToken, setOtpSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const initiateOtp = useCallback(async (targetPhone: string) => {
    setPhone(targetPhone);
    setLoading(true);
    setError(null);
    try {
      const res = await requestOtp(targetPhone);
      if (res.success) {
        setIsModalOpen(true);
        setCooldown(30);
      } else {
        setError(res.error?.message || 'Failed to request OTP');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const submitOtpCode = useCallback(
    async (codeToVerify: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const res = await verifyOtp(phone, codeToVerify);
        if (res.success && res.data?.otpSessionToken) {
          setOtpSessionToken(res.data.otpSessionToken);
          setIsModalOpen(false);
          return true;
        } else {
          setError(res.error?.message || 'Invalid verification code');
          return false;
        }
      } catch (err) {
        setError(getErrorMessage(err));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [phone]
  );

  const resendOtp = useCallback(async () => {
    if (cooldown > 0 || !phone) return;
    await initiateOtp(phone);
  }, [cooldown, phone, initiateOtp]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setError(null);
  }, []);

  return {
    phone,
    isModalOpen,
    otpCode,
    setOtpCode,
    otpSessionToken,
    loading,
    error,
    cooldown,
    initiateOtp,
    submitOtpCode,
    resendOtp,
    closeModal,
  };
}
