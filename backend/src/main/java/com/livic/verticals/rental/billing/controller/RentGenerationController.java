package com.livic.verticals.rental.billing.controller;

import com.livic.core.finance.dto.BillDTOs;
import com.livic.platform.common.response.ApiResponse;
import com.livic.verticals.rental.billing.dto.RentGenerationDTOs.BatchGenerateBillRequest;
import com.livic.verticals.rental.billing.dto.RentGenerationDTOs.BatchGenerateResult;
import com.livic.verticals.rental.billing.dto.RentGenerationDTOs.GenerateBillRequest;
import com.livic.verticals.rental.billing.service.interfaces.RentGenerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Rent generation, kept on the bills path so existing clients are unaffected.
 *
 * <p>These endpoints read leases, so they belong to rental; the rest of the bills API, including
 * the pre-flight checklist, stays in core, where an owner with no lease can also be billed.
 */
@RestController
@RequestMapping("/api/v1/finance/bills")
@RequiredArgsConstructor
public class RentGenerationController {

    private final RentGenerationService rentGenerationService;

    @PostMapping("/generate")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.verticals.rental.lease.security.LeaseResources).LEASE, #request.leaseId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<BillDTOs.BillResponse>> generate(@Valid @RequestBody GenerateBillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(rentGenerationService.generate(request)));
    }

    @PostMapping("/batch-generate")
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId, 'BILL_MANAGE')")
    public ResponseEntity<ApiResponse<BatchGenerateResult>> batchGenerate(@Valid @RequestBody BatchGenerateBillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(rentGenerationService.batchGenerate(request)));
    }
}
