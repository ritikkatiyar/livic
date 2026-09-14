'use client';

import { useState } from 'react';
import { createLead } from '@/api/marketplace';
import { CreateLeadRequest, LeadResponse } from '@/types/lead';
import { getErrorMessage } from '@/utils/errors';

export type SubmitLeadResult = { lead: LeadResponse | null; error: string | null };

export function useCreateLead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLead, setCreatedLead] = useState<LeadResponse | null>(null);

  const submitLead = async (
    propertyId: string,
    unitId: string,
    req: CreateLeadRequest,
    otpSessionToken: string
  ): Promise<SubmitLeadResult> => {
    setLoading(true);
    setError(null);
    try {
      const res = await createLead(propertyId, unitId, req, otpSessionToken);
      if (res.success && res.data) {
        setCreatedLead(res.data);
        return { lead: res.data, error: null };
      }
      const message = res.error?.message || 'Failed to submit request';
      setError(message);
      return { lead: null, error: message };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { lead: null, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { submitLead, createdLead, loading, error };
}
