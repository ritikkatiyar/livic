package com.livic.platform.payment.dto;

public record SubscriptionRequest(
    String userId,
    String planName,
    double amount,
    String billingCycle, // MONTHLY, YEARLY
    PaymentGatewayType gateway
) {}
