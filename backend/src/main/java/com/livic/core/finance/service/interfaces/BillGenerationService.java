package com.livic.core.finance.service.interfaces;

import com.livic.core.finance.dto.BillDTOs;
import com.livic.core.finance.dto.BillDraft;

import java.util.List;

/**
 * Turns bill drafts into bills: the caller's lines plus the property's charges, a total, and a
 * ledger entry for the change. One engine for every bill type, so residential maintenance and
 * rental rent are billed the same way.
 */
public interface BillGenerationService {

    /** Generates one bill, or regenerates it if it exists and is not paid. */
    BillDTOs.BillResponse generate(BillDraft draft);

    /**
     * Generates each draft in its own transaction, so one failure does not undo the others.
     * Outcomes come back in the order of the drafts.
     */
    List<BillDraft.Outcome> generateAll(List<BillDraft> drafts);
}
