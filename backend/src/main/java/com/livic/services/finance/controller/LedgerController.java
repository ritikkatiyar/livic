package com.livic.services.finance.controller;

import com.livic.platform.common.response.ApiResponse;
import com.livic.services.finance.dto.LedgerDTOs.LedgerEntryResponse;
import com.livic.services.finance.service.interfaces.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/ledger")
@RequiredArgsConstructor
public class LedgerController {

    private final LedgerService ledgerService;

    @GetMapping
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'LEDGER_VIEW')")
    public ResponseEntity<ApiResponse<Page<LedgerEntryResponse>>> getLedgerForProperty(
            @RequestParam UUID propertyId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC, size = 20) Pageable pageable) {
        Page<LedgerEntryResponse> ledger = ledgerService.getLedgerForProperty(propertyId, search, fromDate, toDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(ledger));
    }
}
