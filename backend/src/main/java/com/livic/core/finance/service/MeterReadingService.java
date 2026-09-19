package com.livic.core.finance.service;

import com.livic.core.finance.dto.MeterReadingDTOs.MeterReadingResponse;
import com.livic.core.finance.dto.MeterReadingDTOs.MeterReadingRequest;

import java.util.List;
import java.util.UUID;

public interface MeterReadingService {
    List<MeterReadingResponse> getOrCreateWorksheet(UUID propertyId, UUID chargeConfigId, Integer month, Integer year);
    void batchSaveReadings(MeterReadingRequest request);
}
