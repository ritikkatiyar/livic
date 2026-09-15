'use client';

import { useState } from 'react';
import { ApiError } from '@/api/client';
import { toExistingTourRequest } from '@/api/adapters';
import { createLead } from '@/api/marketplace';
import { CreateLeadRequest, ExistingTourRequest, LeadResponse, TOUR_SLOT_DECLINED_CODE } from '@/types/lead';
import { getErrorMessage } from '@/utils/errors';

export type SubmitLeadResult = {
  lead: LeadResponse | null;
  error: string | null;
  /** Set when the phone already has an active tour at this property (409). */
  duplicate: { existingRequest: ExistingTourRequest | null } | null;
  /** The slot (ISO instant) the landlord already declined for this phone, when that is why the request was refused. */
  declinedSlot: string | null;
};

function readDeclinedSlot(err: ApiError, fallback: string | undefined): string | null {
  const details = err.details as { declinedSlot?: unknown } | undefined;
  return typeof details?.declinedSlot === 'string' ? details.declinedSlot : fallback ?? null;
}

export function useCreateLead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLead, setCreatedLead] = useState<LeadResponse | null>(null);
  const [duplicate, setDuplicate] = useState<SubmitLeadResult['duplicate']>(null);

  const submitLead = async (
    propertyId: string,
    unitId: string,
    req: CreateLeadRequest,
    otpSessionToken: string
  ): Promise<SubmitLeadResult> => {
    setLoading(true);
    setError(null);
    setDuplicate(null);
    try {
      const res = await createLead(propertyId, unitId, req, otpSessionToken);
      if (res.success && res.data) {
        setCreatedLead(res.data);
        return { lead: res.data, error: null, duplicate: null, declinedSlot: null };
      }
      const message = res.error?.message || 'Failed to submit request';
      setError(message);
      return { lead: null, error: message, duplicate: null, declinedSlot: null };
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && req.leadType === 'TOUR_REQUEST') {
        if (err.code === TOUR_SLOT_DECLINED_CODE) {
          setError(err.message);
          return { lead: null, error: err.message, duplicate: null, declinedSlot: readDeclinedSlot(err, req.preferredSlot) };
        }
        // Shown as a dedicated notice with the existing request instead of a plain error line
        const dup = { existingRequest: toExistingTourRequest(err.details) };
        setDuplicate(dup);
        return { lead: null, error: null, duplicate: dup, declinedSlot: null };
      }
      const message = getErrorMessage(err);
      setError(message);
      return { lead: null, error: message, duplicate: null, declinedSlot: null };
    } finally {
      setLoading(false);
    }
  };

  const clearDuplicate = () => setDuplicate(null);

  return { submitLead, createdLead, loading, error, duplicate, clearDuplicate };
}
