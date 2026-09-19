package com.livic.core.finance.service;

import com.livic.core.finance.dto.BillingWorksheetDTOs.WorksheetEntryResponse;
import com.livic.core.finance.dto.BillingWorksheetDTOs.WorksheetSaveRequest;

import java.util.List;
import java.util.UUID;

public interface BillingWorksheetService {
    List<WorksheetEntryResponse> getOrCreateWorksheetForMonth(UUID propertyId, UUID chargeConfigId, String billingMonth);
    void saveWorksheet(WorksheetSaveRequest request);
}
