package com.livic.core.finance.controller;

import com.livic.core.finance.dto.BillingWorksheetDTOs.WorksheetEntryResponse;
import com.livic.core.finance.dto.BillingWorksheetDTOs.WorksheetSaveRequest;
import com.livic.core.finance.service.interfaces.BillingWorksheetService;
import com.livic.platform.common.response.ApiResponse;
import com.livic.platform.security.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/billing-worksheets")
@RequiredArgsConstructor
public class BillingWorksheetController {

    private final BillingWorksheetService worksheetService;

    @GetMapping
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'BILLING_WORKSHEET_VIEW')")
    public ResponseEntity<ApiResponse<List<WorksheetEntryResponse>>> getOrCreateWorksheet(
            @RequestParam UUID propertyId,
            @RequestParam UUID chargeConfigId,
            @RequestParam String billingMonth,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        List<WorksheetEntryResponse> responses = worksheetService.getOrCreateWorksheetForMonth(
                propertyId, chargeConfigId, billingMonth, UUID.fromString(currentUser.getId()));
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/batch-save")
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId, 'BILLING_WORKSHEET_MANAGE')")
    public ResponseEntity<ApiResponse<Void>> saveWorksheet(@Valid @RequestBody WorksheetSaveRequest request) {
        worksheetService.saveWorksheet(request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
