package com.livic.core.finance.controller;

import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.common.enums.ResourceType;
import com.livic.platform.common.response.ApiResponse;
import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.core.finance.service.interfaces.BillService;
import com.livic.platform.payment.dto.PaymentInitiationResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/rent-cycles")
@RequiredArgsConstructor
@Slf4j
public class BillController {

    private final BillService billService;

    @PostMapping("/generate")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).LEASE, #request.leaseId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<BillDTOs.BillResponse>> generate(
            @Valid @RequestBody BillDTOs.GenerateBillRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(billService.generate(request)));
    }

    @PostMapping("/batch-generate")
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId, 'RENT_ROLL_MANAGE')")
    public ResponseEntity<ApiResponse<BillDTOs.BatchGenerateResult>> batchGenerate(
            @Valid @RequestBody BillDTOs.BatchGenerateBillRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(billService.batchGenerate(request)));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).BILL, #id, 'RENT_ROLL_MANAGE')")
    public ResponseEntity<ApiResponse<BillDTOs.BillResponse>> publish(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(billService.publish(id)));
    }

    @PostMapping("/{id}/unpublish")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).BILL, #id, 'RENT_ROLL_MANAGE')")
    public ResponseEntity<ApiResponse<BillDTOs.BillResponse>> unpublish(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(billService.unpublish(id)));
    }

    @PostMapping("/batch-publish")
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId, 'RENT_ROLL_MANAGE')")
    public ResponseEntity<ApiResponse<BillDTOs.BatchPublishResult>> batchPublish(
            @Valid @RequestBody BillDTOs.BillPropertyBillingMonthRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(billService.batchPublish(request.propertyId(), request.billingMonth())));
    }

    @PostMapping("/batch-unpublish")
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId, 'RENT_ROLL_MANAGE')")
    public ResponseEntity<ApiResponse<BillDTOs.BatchUnpublishResult>> batchUnpublish(
            @Valid @RequestBody BillDTOs.BillPropertyBillingMonthRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(billService.batchUnpublish(request.propertyId(), request.billingMonth())));
    }

    @GetMapping({"/pre-flight", "/preflight"})
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'RENT_ROLL_VIEW')")
    public ResponseEntity<ApiResponse<BillDTOs.PreFlightChecklistResponse>> getPreFlightChecklist(
            @RequestParam UUID propertyId,
            @RequestParam String billingMonth
    ) {
        return ResponseEntity.ok(ApiResponse.success(billService.getPreFlightChecklist(propertyId, billingMonth)));
    }

    @GetMapping
    @PreAuthorize("#propertyId == null or @authorizationService.hasPermission(#propertyId, 'RENT_ROLL_VIEW')")
    public ResponseEntity<ApiResponse<BillDTOs.BillListResponse>> list(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) UUID leaseId,
            @RequestParam(required = false) String billingMonth,
            @RequestParam(required = false) BillStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(sort = "dueDate", direction = Sort.Direction.DESC, size = 20) Pageable pageable
    ) {
        UUID currentUserId = currentUser != null ? UUID.fromString(currentUser.getId()) : null;
        return ResponseEntity.ok(ApiResponse.success(billService.list(currentUserId, propertyId, leaseId, billingMonth, status, search, pageable)));
    }

    @PostMapping("/{id}/mark-paid")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).BILL, #id, 'RENT_ROLL_MANAGE')")
    public ResponseEntity<ApiResponse<BillDTOs.BillResponse>> markPaid(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(billService.markPaid(id)));
    }

    @PostMapping("/{billId}/online")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).BILL, #billId, 'LEASE_VIEW_OWN')")
    public ResponseEntity<ApiResponse<PaymentInitiationResponse>> initiateRentOnlinePayment(
            @PathVariable UUID billId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        log.info("API request: Initiate online rent payment for Bill: {}", billId);
        UUID payerUserId = UUID.fromString(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(billService.initiateOnlinePayment(billId, payerUserId)));
    }

    @PostMapping("/{billId}/cash")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).BILL, #billId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<PaymentInitiationResponse>> recordRentCashPayment(
            @PathVariable UUID billId,
            @Valid @RequestBody BillDTOs.RecordRentCashPaymentRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        log.info("API request: Record cash rent payment for Bill: {}", billId);
        UUID confirmedBy = UUID.fromString(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(
                billService.recordCashPayment(billId, request.amount(), request.note(), request.payerUserId(), confirmedBy)
        ));
    }
}
