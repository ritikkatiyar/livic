package com.livic.payment.dto;

public record PaymentIntentResponse(
    String transactionId,
    String clientSecret,
    String gatewayTransactionId,
    String paymentUrl,
    String status // PENDING, SUCCESS, FAILED
) {}
