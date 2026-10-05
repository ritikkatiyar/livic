package com.livic.core.finance.service.interfaces;

import com.livic.core.finance.dto.BillingWorksheetDTOs.WorksheetEntryResponse;
import com.livic.core.finance.dto.BillingWorksheetDTOs.WorksheetSaveRequest;

import java.util.List;
import java.util.UUID;

/**
 * The values of a property's fixed charges, per unit and month, entered before bills are
 * generated. A unit appears once it has someone who pays for it.
 */
public interface BillingWorksheetService {

    List<WorksheetEntryResponse> getOrCreateWorksheetForMonth(UUID propertyId, UUID chargeConfigId, String billingMonth, UUID actingUserId);

    void saveWorksheet(WorksheetSaveRequest request);

    /**
     * Creates the month's missing entries for every active fixed charge, from the base rate or
     * last month's value, so bills can be generated without the worksheet having been opened.
     */
    void prepareMonth(UUID propertyId, String billingMonth, UUID actingUserId);
}
