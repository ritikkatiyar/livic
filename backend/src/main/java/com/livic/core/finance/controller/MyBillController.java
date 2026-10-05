package com.livic.core.finance.controller;

import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.core.finance.service.interfaces.BillService;
import com.livic.platform.common.response.ApiResponse;
import com.livic.platform.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** The bills the current user pays, as a tenant or as an owner. */
@RestController
@RequestMapping("/api/v1/me/bills")
@RequiredArgsConstructor
public class MyBillController {

    private final BillService billService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BillDTOs.BillListResponse>> list(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) String billingMonth,
            @RequestParam(required = false) BillStatus status,
            @PageableDefault(sort = "dueDate", direction = Sort.Direction.DESC, size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                billService.listForPayer(currentUser.getUuid(), billingMonth, status, pageable)));
    }
}
