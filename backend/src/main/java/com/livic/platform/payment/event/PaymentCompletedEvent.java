package com.livic.platform.payment.event;

import lombok.Builder;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * A payment went through. Published through the outbox: each module that took a payment of its
 * {@code referenceType} reacts in its own transaction, after the payment is committed, and is
 * retried on its own if it fails.
 */
@Builder
public record PaymentCompletedEvent(
        UUID transactionId,
        String referenceType,
        UUID referenceId,
        UUID payerUserId,
        BigDecimal amount,
        String gatewayName,
        String gatewayTransactionId
) {
}
