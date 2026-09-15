package com.livic.services.finance.controller;

import com.livic.platform.common.response.ApiResponse;
import com.livic.services.finance.dto.MeterReadingDTOs.MeterReadingRequest;
import com.livic.services.finance.dto.MeterReadingDTOs.MeterReadingResponse;
import com.livic.services.finance.service.MeterReadingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/meter-readings")
@RequiredArgsConstructor
public class MeterReadingController {

    private final MeterReadingService meterReadingService;

    @GetMapping("/worksheet")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'METER_READING_VIEW')")
    public ResponseEntity<ApiResponse<List<MeterReadingResponse>>> getWorksheet(
            @RequestParam UUID propertyId,
            @RequestParam UUID chargeConfigId,
            @RequestParam Integer month,
            @RequestParam Integer year) {
        
        return ResponseEntity.ok(ApiResponse.success(meterReadingService.getOrCreateWorksheet(propertyId, chargeConfigId, month, year)));
    }

    @PostMapping("/batch-save")
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId, 'METER_READING_CREATE')")
    public ResponseEntity<ApiResponse<Void>> batchSaveReadings(@RequestBody MeterReadingRequest request) {
        meterReadingService.batchSaveReadings(request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
