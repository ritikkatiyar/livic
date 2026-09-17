package com.livic.features.marketplace.controller;

import com.livic.features.marketplace.dto.MarketplaceLeadDTOs.CreateLeadRequest;
import com.livic.features.marketplace.dto.MarketplaceLeadDTOs.LeadResponse;
import com.livic.features.marketplace.dto.MarketplaceLeadDTOs.LeadStatusResponse;
import com.livic.features.marketplace.dto.MarketplaceLeadDTOs.TokenPaymentInitResponse;
import com.livic.features.marketplace.service.interfaces.MarketplaceLeadService;
import com.livic.platform.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/marketplace")
@RequiredArgsConstructor
public class MarketplaceLeadController {

    private final MarketplaceLeadService leadService;

    @PostMapping("/properties/{propertyId}/units/{unitId}/leads")
    public ResponseEntity<ApiResponse<LeadResponse>> createLead(
            @PathVariable UUID propertyId,
            @PathVariable UUID unitId,
            @RequestHeader(name = "X-Otp-Session-Token", required = false) String sessionToken,
            @Valid @RequestBody CreateLeadRequest request
    ) {
        LeadResponse response = leadService.createLead(propertyId, unitId, request, sessionToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping("/leads/{leadId}")
    public ResponseEntity<ApiResponse<LeadStatusResponse>> getLeadStatus(
            @PathVariable UUID leadId
    ) {
        LeadStatusResponse response = leadService.getLeadStatus(leadId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/leads/{leadId}/token-payment/online")
    public ResponseEntity<ApiResponse<TokenPaymentInitResponse>> initiateTokenPayment(
            @PathVariable UUID leadId
    ) {
        TokenPaymentInitResponse response = leadService.initiateTokenPayment(leadId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
