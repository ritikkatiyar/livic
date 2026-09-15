/**
 * Keeps the OTP-verified session for the current browser tab so the prospect can move between a room page,
 * the confirmation screen and "My Requests" without verifying their phone again.
 *
 * sessionStorage (not localStorage): the session ends with the tab, and the backend token itself
 * expires 15 minutes after verification anyway.
 */

export type StoredOtpSession = {
  token: string;
  phone: string;
  /** Epoch milliseconds after which the backend rejects the token. */
  expiresAt: number;
};

const STORAGE_KEY = 'livic.marketplace.otpSession';
/** Matches the backend session lifetime; used when the server did not send an explicit expiry. */
export const OTP_SESSION_TTL_MS = 15 * 60 * 1000;
/** Treat a session as expired slightly early so a request never races the server-side expiry. */
const EXPIRY_SAFETY_MARGIN_MS = 30 * 1000;

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    // Access can throw (e.g. storage disabled); behave as if nothing is stored
    return null;
  }
}

// --- Subscription (for useSyncExternalStore) --------------------------------------------------------------

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSession: StoredOtpSession | null = null;

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeOtpSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Stable snapshot of the stored session: the same object is returned until the stored value changes. */
export function getOtpSessionSnapshot(): StoredOtpSession | null {
  let raw: string | null = null;
  try {
    raw = storage()?.getItem(STORAGE_KEY) ?? null;
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSession = raw ? loadOtpSession() : null;
  }
  return cachedSession;
}

export function getServerOtpSessionSnapshot(): StoredOtpSession | null {
  return null;
}

export function saveOtpSession(token: string, phone: string, expiresAt?: string | number | null, now: number = Date.now()): void {
  const parsedExpiry = typeof expiresAt === 'string' ? Date.parse(expiresAt) : expiresAt;
  const session: StoredOtpSession = {
    token,
    phone,
    expiresAt: parsedExpiry && Number.isFinite(parsedExpiry) ? parsedExpiry : now + OTP_SESSION_TTL_MS,
  };
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Quota or privacy mode: the session simply isn't remembered
  }
  notify();
}

export function loadOtpSession(now: number = Date.now()): StoredOtpSession | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Partial<StoredOtpSession>;
    if (!session.token || !session.phone || typeof session.expiresAt !== 'number') {
      store.removeItem(STORAGE_KEY);
      return null;
    }
    if (session.expiresAt - EXPIRY_SAFETY_MARGIN_MS <= now) {
      store.removeItem(STORAGE_KEY);
      return null;
    }
    return session as StoredOtpSession;
  } catch {
    return null;
  }
}

export function clearOtpSession(): void {
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  notify();
}

/** Backend messages that mean the stored session can no longer be used. */
export function isOtpSessionError(message: string | null | undefined): boolean {
  return Boolean(message && /otp (verification )?session/i.test(message));
}
