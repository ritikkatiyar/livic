package com.livic.verticals.rental.billing.controller;

import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.platform.common.response.ApiResponse;
import com.livic.platform.security.UserDetailsImpl;
import com.livic.verticals.rental.billing.service.interfaces.LeaseBillService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * The bills of one lease. Core's bill list knows payers, not leases, so rental answers this and
 * maps the lease to its member. It used to be {@code GET /bills?leaseId=}, answered by core with
 * no check on the lease, so any signed-in user could list a lease's bills.
 */
@RestController
@RequestMapping("/api/v1/finance/leases")
@RequiredArgsConstructor
public class LeaseBillController {

    private final LeaseBillService leaseBillService;

    @GetMapping("/{leaseId}/bills")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).LEASE, #leaseId, 'LEASE_VIEW')"
            + " or @authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).LEASE, #leaseId, 'LEASE_VIEW_OWN')")
    public ResponseEntity<ApiResponse<BillDTOs.BillListResponse>> listForLease(
            @PathVariable UUID leaseId,
            @RequestParam(required = false) String billingMonth,
            @RequestParam(required = false) BillStatus status,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PageableDefault(sort = "dueDate", direction = Sort.Direction.DESC, size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(leaseBillService.listForLease(
                leaseId, UUID.fromString(currentUser.getId()), billingMonth, status, pageable)));
    }
}
