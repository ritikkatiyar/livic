'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { requestOtp, verifyOtp } from '@/api/marketplace';
import { getErrorMessage } from '@/utils/errors';
import {
  clearOtpSession,
  getOtpSessionSnapshot,
  getServerOtpSessionSnapshot,
  saveOtpSession,
  subscribeOtpSession,
} from './otpSessionStorage';

// Matches the backend cooldown; the server's resendAfterSeconds takes precedence when present
const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;

const noopSubscribe = () => () => {};

export function useOtpVerification() {
  const [otpTargetPhone, setOtpTargetPhone] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // A phone verified earlier in this tab (e.g. on the room page) is reused so the prospect isn't asked again
  const stored = useSyncExternalStore(subscribeOtpSession, getOtpSessionSnapshot, getServerOtpSessionSnapshot);
  /** True on the client after hydration, once any session remembered in this tab can be read. */
  const isSessionRestored = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const otpSessionToken = stored?.token ?? null;
  const verifiedPhone = stored?.phone ?? null;
  const phone = otpTargetPhone || verifiedPhone || '';

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  /** Requests a code and opens the modal. Returns false (with `error` set) if the request failed. */
  const initiateOtp = useCallback(async (targetPhone: string): Promise<boolean> => {
    setOtpTargetPhone(targetPhone);
    setOtpCode('');
    setLoading(true);
    setError(null);
    try {
      const res = await requestOtp(targetPhone);
      if (res.success) {
        setIsModalOpen(true);
        setCooldown(res.data?.resendAfterSeconds ?? DEFAULT_RESEND_COOLDOWN_SECONDS);
        return true;
      }
      setError(res.error?.message || 'Failed to request OTP');
      return false;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Verifies the code and returns the session token issued by the server, or null if verification failed. */
  const submitOtpCode = useCallback(
    async (codeToVerify: string): Promise<string | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await verifyOtp(phone, codeToVerify);
        if (res.success && res.data?.otpSessionToken) {
          // Notifies every subscriber, so the new token/phone are picked up without local state
          saveOtpSession(res.data.otpSessionToken, phone, res.data.expiresAt);
          setIsModalOpen(false);
          return res.data.otpSessionToken;
        }
        setError(res.error?.message || 'Invalid verification code');
        return null;
      } catch (err) {
        setError(getErrorMessage(err));
        return null;
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

  /** A token verified for `targetPhone`, which can be reused (e.g. to retry a failed submission) without a new OTP. */
  const getSessionTokenFor = useCallback(
    (targetPhone: string): string | null => (otpSessionToken && verifiedPhone === targetPhone ? otpSessionToken : null),
    [otpSessionToken, verifiedPhone]
  );

  /** Forget the current session, e.g. after the server rejected it as expired. */
  const clearSession = useCallback(() => {
    clearOtpSession();
  }, []);

  return {
    phone,
    isModalOpen,
    otpCode,
    setOtpCode,
    otpSessionToken,
    verifiedPhone,
    isSessionRestored,
    loading,
    error,
    cooldown,
    initiateOtp,
    submitOtpCode,
    resendOtp,
    closeModal,
    getSessionTokenFor,
    clearSession,
  };
}
