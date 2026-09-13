package com.livic.billing.controller;

import com.livic.security.UserDetailsImpl;
import com.livic.billing.dto.*;
import com.livic.billing.service.interfaces.BillingWalletService;
import com.livic.billing.service.interfaces.SubscriptionPlanQueryService;
import com.livic.common.response.ApiResponse;
import com.livic.payment.dto.PaymentInitiationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
@Slf4j
public class BillingController {

    private final BillingWalletService walletService;
    private final SubscriptionPlanQueryService planQueryService;

    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<List<PlanResponse>>> getPlans() {
        return ResponseEntity.ok(ApiResponse.success(planQueryService.getAllActivePlans()));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<BillingStatusResponse>> getStatus(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(walletService.getBillingStatus(userId)));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<ApiResponse<PaymentInitiationResponse>> subscribe(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody SubscriptionRequest request
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(walletService.subscribeToPlan(userId, request)));
    }

    @PostMapping("/topup")
    public ResponseEntity<ApiResponse<PaymentIntentResponse>> topUpWallet(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody PaymentIntentRequest request
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        PaymentIntentResponse response = walletService.topUpWallet(userId, currentUser.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
