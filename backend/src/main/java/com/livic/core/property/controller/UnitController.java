package com.livic.core.property.controller;

import com.livic.platform.common.response.ApiResponse;
import com.livic.core.property.dto.PropertyDTOs;
import com.livic.core.property.dto.UnitDTOs;
import com.livic.core.property.domain.UnitTbl;
import com.livic.core.property.service.interfaces.UnitService;
import com.livic.core.property.service.interfaces.UnitQueryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import com.livic.core.property.service.impl.UnitLayoutOrchestrationService;

@RestController
@RequestMapping("/api/v1/properties/{propertyId}")
@RequiredArgsConstructor
public class UnitController {

    private final UnitService unitService;
    private final UnitQueryService unitQueryService;
    private final UnitLayoutOrchestrationService unitLayoutOrchestrationService;

    @GetMapping("/floors")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<List<UnitDTOs.FloorSummaryResponse>>> listFloorsForConfiguration(
            @PathVariable UUID propertyId,
            @RequestParam(required = false) Integer throughFloor) {
        List<UnitDTOs.FloorSummaryResponse> rows = unitQueryService.getFloorSummaries(propertyId, throughFloor);
        return ResponseEntity.ok(ApiResponse.success(rows));
    }

    @GetMapping("/floors/{floorNumber}/layout")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<List<UnitDTOs.UnitResponse>>> getFloorLayout(
            @PathVariable UUID propertyId,
            @PathVariable int floorNumber) {
        List<UnitDTOs.UnitResponse> layout = unitLayoutOrchestrationService.getFloorLayout(propertyId, floorNumber);
        return ResponseEntity.ok(ApiResponse.success(layout));
    }

    @GetMapping("/floors/layouts")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<List<UnitDTOs.UnitResponse>>> getAllFloorsLayout(
            @PathVariable UUID propertyId) {
        List<UnitDTOs.UnitResponse> layout = unitLayoutOrchestrationService.getAllFloorsLayout(propertyId);
        return ResponseEntity.ok(ApiResponse.success(layout));
    }

    @PutMapping("/floors/{floorNumber}/layout")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<List<UnitDTOs.UnitResponse>>> saveFloorLayout(
            @PathVariable UUID propertyId,
            @PathVariable int floorNumber,
            @Valid @RequestBody List<UnitDTOs.FloorLayoutUnitRequest> items) {
        List<UnitDTOs.UnitResponse> saved = unitLayoutOrchestrationService.saveFloorLayout(propertyId, floorNumber, items);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    @PostMapping("/units/batch")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<List<UnitDTOs.UnitResponse>>> generateBatchUnits(
            @PathVariable UUID propertyId,
            @Valid @RequestBody PropertyDTOs.BatchUnitRequest request) {
        List<UnitTbl> units = unitService.generateBatchUnits(propertyId, request);
        return ResponseEntity.ok(ApiResponse.success(unitLayoutOrchestrationService.getFloorLayout(propertyId, request.startingFloorNumber())));
    }

    @GetMapping("/units/vacating")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<List<UnitDTOs.UnitResponse>>> getVacatingUnits(
            @PathVariable UUID propertyId) {
        List<UnitDTOs.UnitResponse> units = unitLayoutOrchestrationService.getVacatingUnits(propertyId);
        return ResponseEntity.ok(ApiResponse.success(units));
    }
}
