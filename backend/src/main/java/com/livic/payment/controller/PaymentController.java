package com.livic.payment.controller;

import com.livic.security.UserDetailsImpl;
import com.livic.common.response.ApiResponse;
import com.livic.payment.dto.PaymentTransactionResponse;
import com.livic.payment.dto.PaymentVerificationRequest;
import com.livic.payment.service.interfaces.PaymentTransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentTransactionService paymentTransactionService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentTransactionResponse>> getTransaction(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        log.info("API request: Get payment transaction: {} by user: {}", id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(paymentTransactionService.getTransactionResponse(id)));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<String>> verifyPayment(
            @RequestBody PaymentVerificationRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        log.info("API request: Verify Razorpay payment orderId={} by user={}", request.razorpayOrderId(), userDetails.getId());
        paymentTransactionService.verifyAndCompletePayment(request);
        return ResponseEntity.ok(ApiResponse.success("Payment verified and subscription activated"));
    }

    @PostMapping("/webhooks/{gatewayName}")
    public ResponseEntity<Void> handleWebhook(
            @PathVariable String gatewayName,
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signatureHeader
    ) {
        log.info("Received webhook for gateway: {}", gatewayName);
        paymentTransactionService.handleWebhook(gatewayName, payload, signatureHeader);
        return ResponseEntity.ok().build();
    }
}
