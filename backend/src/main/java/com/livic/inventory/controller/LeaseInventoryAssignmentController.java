package com.livic.inventory.controller;

import com.livic.security.UserDetailsImpl;
import com.livic.common.enums.ResourceType;
import com.livic.common.response.ApiResponse;
import com.livic.inventory.dto.ApproveDeductionsRequest;
import com.livic.inventory.dto.AssignmentItemResponse;
import com.livic.inventory.dto.CreateAssignmentRequest;
import com.livic.inventory.dto.MoveOutChecklistRequest;
import com.livic.inventory.dto.ReturnVerificationRequest;
import com.livic.inventory.dto.VerificationItemResponse;
import com.livic.inventory.service.interfaces.LeaseInventoryAssignmentService;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class LeaseInventoryAssignmentController {

    private final LeaseInventoryAssignmentService assignmentService;

    @PostMapping("/leases/{leaseId}/assignments")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.common.enums.ResourceType).LEASE, #leaseId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<List<AssignmentItemResponse>>> createAssignments(
            @PathVariable UUID leaseId,
            @Valid @RequestBody CreateAssignmentRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        List<AssignmentItemResponse> response = assignmentService.createAssignments(leaseId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping("/leases/{leaseId}/assignments")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.common.enums.ResourceType).LEASE, #leaseId, 'LEASE_VIEW') or @authorizationService.hasPermission(T(com.livic.common.enums.ResourceType).LEASE, #leaseId, 'LEASE_VIEW_OWN')")
    public ResponseEntity<ApiResponse<Page<AssignmentItemResponse>>> getAssignments(
            @PathVariable UUID leaseId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<AssignmentItemResponse> response = assignmentService.getAssignmentsForLease(leaseId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/leases/{leaseId}/move-out-checklist")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.common.enums.ResourceType).LEASE, #leaseId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<List<VerificationItemResponse>>> generateMoveOutChecklist(
            @PathVariable UUID leaseId,
            @RequestBody(required = false) MoveOutChecklistRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        List<VerificationItemResponse> response = assignmentService.generateMoveOutChecklist(
                leaseId, 
                request != null ? request : new MoveOutChecklistRequest(null), 
                userId
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/assignments/{assignmentId}/return-verification")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.common.enums.ResourceType).INVENTORY_ASSIGNMENT, #assignmentId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<VerificationItemResponse>> verifyReturn(
            @PathVariable UUID assignmentId,
            @Valid @RequestBody ReturnVerificationRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        VerificationItemResponse response = assignmentService.verifyReturn(assignmentId, request, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/leases/{leaseId}/deductions/approve")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.common.enums.ResourceType).LEASE, #leaseId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<List<VerificationItemResponse>>> approveDeductions(
            @PathVariable UUID leaseId,
            @RequestBody ApproveDeductionsRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        List<VerificationItemResponse> response = assignmentService.approveDeductions(leaseId, request, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/leases/{leaseId}/verification-checklist")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.common.enums.ResourceType).LEASE, #leaseId, 'LEASE_VIEW') or @authorizationService.hasPermission(T(com.livic.common.enums.ResourceType).LEASE, #leaseId, 'LEASE_VIEW_OWN')")
    public ResponseEntity<ApiResponse<Page<VerificationItemResponse>>> getVerificationChecklist(
            @PathVariable UUID leaseId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<VerificationItemResponse> response = assignmentService.getVerificationChecklistForLease(leaseId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
