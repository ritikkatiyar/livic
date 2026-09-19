package com.livic.core.finance.controller;

import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.common.enums.ResourceType;
import com.livic.platform.common.response.ApiResponse;
import com.livic.core.finance.dto.LeaseDTOs;
import com.livic.core.finance.service.interfaces.LeaseOrchestrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/leases")
@RequiredArgsConstructor
public class LeaseController {

    private final LeaseOrchestrationService leaseOrchestrationService;

    @GetMapping
    @PreAuthorize("#propertyId == null or @authorizationService.hasPermission(#propertyId, 'LEASE_VIEW')")
    public ResponseEntity<ApiResponse<Page<LeaseDTOs.LeaseResponse>>> getActiveLeasesByProperty(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) UUID propertyId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        UUID currentUserId = currentUser != null ? UUID.fromString(currentUser.getId()) : null;
        return ResponseEntity.ok(ApiResponse.success(leaseOrchestrationService.getActiveLeasesByProperty(currentUserId, propertyId, pageable)));
    }

    @GetMapping("/tenant/active")
    public ResponseEntity<ApiResponse<LeaseDTOs.LeaseResponse>> getActiveTenantLease(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        return leaseOrchestrationService.getActiveTenantLease(userId)
                .map(lease -> ResponseEntity.ok(ApiResponse.success(lease)))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success(null)));
    }

    @PostMapping
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).UNIT, #request.unitId, 'LEASE_CREATE')")
    public ResponseEntity<ApiResponse<LeaseDTOs.LeaseResponse>> create(
            @Valid @RequestBody LeaseDTOs.CreateLeaseRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        UUID assignedByUserId = UUID.fromString(currentUser.getId());
        LeaseDTOs.LeaseResponse response = leaseOrchestrationService.createLease(request, assignedByUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).LEASE, #id, 'LEASE_VIEW') or @authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).LEASE, #id, 'LEASE_VIEW_OWN')")
    public ResponseEntity<ApiResponse<LeaseDTOs.LeaseResponse>> get(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(leaseOrchestrationService.getLeaseById(id)));
    }

    @PutMapping("/{id}/terminate")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).LEASE, #id, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<LeaseDTOs.LeaseResponse>> terminateLease(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(leaseOrchestrationService.terminateLease(id)));
    }

    @PutMapping("/{id}/notice")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).LEASE, #id, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<LeaseDTOs.LeaseResponse>> serveNotice(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request
    ) {
        String moveOutDateStr = request.get("moveOutDate");
        LocalDate moveOutDate = moveOutDateStr != null ? LocalDate.parse(moveOutDateStr) : null;
        return ResponseEntity.ok(ApiResponse.success(leaseOrchestrationService.serveNotice(id, moveOutDate)));
    }

    @PutMapping("/{id}/terms")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).LEASE, #id, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<LeaseDTOs.LeaseResponse>> updateLeaseTerms(
            @PathVariable UUID id,
            @Valid @RequestBody LeaseDTOs.UpdateLeaseTermsRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(leaseOrchestrationService.updateLeaseTerms(id, request)));
    }
}
