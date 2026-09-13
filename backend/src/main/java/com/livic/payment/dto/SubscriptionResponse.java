package com.livic.payment.dto;

public record SubscriptionResponse(
    String subscriptionId,
    String gatewaySubscriptionId,
    String checkoutUrl,
    String status
) {}
