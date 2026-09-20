package com.livic.verticals.rental.billing.controller;

import com.livic.core.finance.dto.BillDTOs;
import com.livic.platform.common.response.ApiResponse;
import com.livic.verticals.rental.billing.service.interfaces.RentGenerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Rent generation, kept on the bills path so existing clients are unaffected.
 *
 * <p>These three endpoints read leases, so they belong to rental; the rest of the bills API
 * stays in core, where an owner with no lease can also be billed.
 */
@RestController
@RequestMapping("/api/v1/finance/rent-cycles")
@RequiredArgsConstructor
public class RentGenerationController {

    private final RentGenerationService rentGenerationService;

    @PostMapping("/generate")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).LEASE, #request.leaseId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<BillDTOs.BillResponse>> generate(
            @Valid @RequestBody BillDTOs.GenerateBillRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(rentGenerationService.generate(request)));
    }

    @PostMapping("/batch-generate")
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId, 'RENT_ROLL_MANAGE')")
    public ResponseEntity<ApiResponse<BillDTOs.BatchGenerateResult>> batchGenerate(
            @Valid @RequestBody BillDTOs.BatchGenerateBillRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(rentGenerationService.batchGenerate(request)));
    }

    @GetMapping({"/pre-flight", "/preflight"})
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'RENT_ROLL_VIEW')")
    public ResponseEntity<ApiResponse<BillDTOs.PreFlightChecklistResponse>> getPreFlightChecklist(
            @RequestParam UUID propertyId,
            @RequestParam String billingMonth
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentGenerationService.getPreFlightChecklist(propertyId, billingMonth)));
    }

}
