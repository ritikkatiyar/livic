package com.livic.verticals.rental.billing.service.interfaces;

import com.livic.core.finance.dto.BillDTOs;
import com.livic.verticals.rental.billing.dto.RentGenerationDTOs.BatchGenerateBillRequest;
import com.livic.verticals.rental.billing.dto.RentGenerationDTOs.BatchGenerateResult;
import com.livic.verticals.rental.billing.dto.RentGenerationDTOs.GenerateBillRequest;

/**
 * Turning leases into rent bills.
 *
 * <p>This is the rental half of billing: it reads the lease and supplies what only the lease
 * knows (the rent, the booking token, how many roommates share the unit). Core's bill
 * generation adds the property's charges and writes the bill.
 */
public interface RentGenerationService {

    BillDTOs.BillResponse generate(GenerateBillRequest request);

    BatchGenerateResult batchGenerate(BatchGenerateBillRequest request);
}
