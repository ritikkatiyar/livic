package com.livic.platform.payment.dto;

public record PaymentIntentRequest(
    String userId,
    double amount,
    String currency,
    String description,
    String email,
    PaymentGatewayType gateway
) {}
