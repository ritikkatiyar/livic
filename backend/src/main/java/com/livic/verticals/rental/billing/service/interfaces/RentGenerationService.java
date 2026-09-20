package com.livic.verticals.rental.billing.service.interfaces;

import com.livic.core.finance.dto.BillDTOs;

import java.util.UUID;

/**
 * Turning leases into rent bills.
 *
 * <p>This is the rental half of billing. It reads the lease, works out the lines and asks
 * core's bill service to write them; core itself must be able to bill an owner who has no
 * lease, so generation cannot live there.
 */
public interface RentGenerationService {

    BillDTOs.BillResponse generate(BillDTOs.GenerateBillRequest request);

    BillDTOs.BatchGenerateResult batchGenerate(BillDTOs.BatchGenerateBillRequest request);

    BillDTOs.PreFlightChecklistResponse getPreFlightChecklist(UUID propertyId, String billingMonth);
}
