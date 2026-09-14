'use client';

import { useState } from 'react';
import { createLead } from '@/api/marketplace';
import { CreateLeadRequest, LeadResponse } from '@/types/lead';
import { getErrorMessage } from '@/utils/errors';

export function useCreateLead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLead, setCreatedLead] = useState<LeadResponse | null>(null);

  const submitLead = async (
    propertyId: string,
    unitId: string,
    req: CreateLeadRequest,
    otpSessionToken: string
  ): Promise<LeadResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await createLead(propertyId, unitId, req, otpSessionToken);
      if (res.success && res.data) {
        setCreatedLead(res.data);
        return res.data;
      } else {
        setError(res.error?.message || 'Failed to submit request');
        return null;
      }
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { submitLead, createdLead, loading, error };
}
