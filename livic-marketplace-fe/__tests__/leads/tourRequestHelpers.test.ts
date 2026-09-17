import { toExistingTourRequest, toMyTourRequestPage } from '@/api/adapters';
import {
  clearOtpSession,
  getOtpSessionSnapshot,
  isOtpSessionError,
  loadOtpSession,
  OTP_SESSION_TTL_MS,
  saveOtpSession,
  subscribeOtpSession,
} from '@/features/leads/otpSessionStorage';
import { getTourStatusPresentation } from '@/features/leads/tourStatus';
import { MyTourRequest } from '@/types/lead';

describe('otpSessionStorage', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('remembers a session until shortly before the server expiry', () => {
    const now = Date.parse('2026-09-15T10:00:00Z');
    saveOtpSession('token-1', '9876543210', '2026-09-15T10:15:00Z', now);

    expect(loadOtpSession(now)).toEqual({ token: 'token-1', phone: '9876543210', expiresAt: Date.parse('2026-09-15T10:15:00Z') });
    // Within the 30 s safety margin the session is treated as expired and removed
    expect(loadOtpSession(Date.parse('2026-09-15T10:14:45Z'))).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('falls back to the default lifetime when the server sent no expiry', () => {
    const now = 1_000_000;
    saveOtpSession('token-1', '9876543210', undefined, now);
    expect(loadOtpSession(now)?.expiresAt).toBe(now + OTP_SESSION_TTL_MS);
  });

  it('drops malformed entries', () => {
    window.sessionStorage.setItem('livic.marketplace.otpSession', JSON.stringify({ token: 'x' }));
    expect(loadOtpSession()).toBeNull();
    window.sessionStorage.setItem('livic.marketplace.otpSession', '{not json');
    expect(loadOtpSession()).toBeNull();
  });

  it('notifies subscribers and returns a stable snapshot', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeOtpSession(listener);

    saveOtpSession('token-1', '9876543210');
    const first = getOtpSessionSnapshot();
    expect(first?.token).toBe('token-1');
    expect(getOtpSessionSnapshot()).toBe(first);

    clearOtpSession();
    expect(getOtpSessionSnapshot()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    saveOtpSession('token-2', '9876543210');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('recognises backend messages about an unusable OTP session', () => {
    expect(isOtpSessionError('OTP session has expired')).toBe(true);
    expect(isOtpSessionError('Invalid OTP verification session')).toBe(true);
    expect(isOtpSessionError('Unit is not available')).toBe(false);
    expect(isOtpSessionError(null)).toBe(false);
  });
});

describe('tour request adapters', () => {
  const backendRequest: MyTourRequest = {
    id: 'lead-1',
    propertyId: 'prop-1',
    propertyName: 'Livic Residency',
    propertyAddress: null,
    propertyCity: 'Bengaluru',
    unitId: 'unit-1',
    unitNumber: '101',
    preferredSlot: '2026-09-17T11:30:00Z',
    status: 'REJECTED',
    decisionNote: 'Room under maintenance',
    decidedAt: '2026-09-15T09:00:00Z',
    cancellable: false,
    createdAt: '2026-09-14T09:00:00Z',
  };

  it('maps a Spring page of my tour requests to a 1-based paged result', () => {
    const result = toMyTourRequestPage({ content: [backendRequest], number: 1, size: 10, totalElements: 11, totalPages: 2 });
    expect(result).toEqual({ items: [backendRequest], page: 2, pageSize: 10, totalItems: 11, totalPages: 2 });
  });

  it('returns an empty page when the backend sent no body', () => {
    expect(toMyTourRequestPage(null)).toEqual({ items: [], page: 1, pageSize: 0, totalItems: 0, totalPages: 0 });
  });

  it('reads the blocking request from a duplicate tour 409 body', () => {
    expect(
      toExistingTourRequest({
        message: 'duplicate',
        existingRequest: { leadId: 'lead-1', unitId: 'unit-1', unitNumber: '101', status: 'NEW', preferredSlot: '2026-09-17T11:30:00Z' },
      })
    ).toEqual({ leadId: 'lead-1', unitId: 'unit-1', unitNumber: '101', status: 'NEW', preferredSlot: '2026-09-17T11:30:00Z' });
    expect(toExistingTourRequest({ message: 'duplicate' })).toBeNull();
    expect(toExistingTourRequest('conflict')).toBeNull();
  });
});

describe('getTourStatusPresentation', () => {
  it.each([
    ['NEW', 'Pending approval', 'warning'],
    ['APPROVED', 'Approved', 'success'],
    ['REJECTED', 'Declined', 'danger'],
    ['CANCELLED', 'Cancelled', 'outline'],
    ['COMPLETED', 'Visit completed', 'indigo'],
    ['EXPIRED', 'Expired', 'default'],
  ] as const)('%s → %s', (status, label, variant) => {
    expect(getTourStatusPresentation(status)).toMatchObject({ label, variant });
  });
});
