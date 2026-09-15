'use client';

import { useState } from 'react';
import { ApiError } from '@/api/client';
import { toExistingTourRequest } from '@/api/adapters';
import { createLead } from '@/api/marketplace';
import { CreateLeadRequest, ExistingTourRequest, LeadResponse } from '@/types/lead';
import { getErrorMessage } from '@/utils/errors';

export type SubmitLeadResult = {
  lead: LeadResponse | null;
  error: string | null;
  /** Set when the phone already has an active tour at this property (409). */
  duplicate: { existingRequest: ExistingTourRequest | null } | null;
};

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
        return { lead: res.data, error: null, duplicate: null };
      }
      const message = res.error?.message || 'Failed to submit request';
      setError(message);
      return { lead: null, error: message, duplicate: null };
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && req.leadType === 'TOUR_REQUEST') {
        // Shown as a dedicated notice with the existing request instead of a plain error line
        const dup = { existingRequest: toExistingTourRequest(err.details) };
        setDuplicate(dup);
        return { lead: null, error: null, duplicate: dup };
      }
      const message = getErrorMessage(err);
      setError(message);
      return { lead: null, error: message, duplicate: null };
    } finally {
      setLoading(false);
    }
  };

  const clearDuplicate = () => setDuplicate(null);

  return { submitLead, createdLead, loading, error, duplicate, clearDuplicate };
}
