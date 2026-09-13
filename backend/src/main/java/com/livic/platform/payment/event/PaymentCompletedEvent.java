package com.livic.platform.payment.event;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
@ToString
public class PaymentCompletedEvent {
    private final UUID transactionId;
    private final String referenceType;
    private final UUID referenceId;
    private final UUID payerUserId;
    private final BigDecimal amount;
    private final String gatewayName;
    private final String gatewayTransactionId;

    public PaymentCompletedEvent(UUID transactionId, String referenceType, UUID referenceId, UUID payerUserId, BigDecimal amount, String gatewayName, String gatewayTransactionId) {
        this.transactionId = transactionId;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.payerUserId = payerUserId;
        this.amount = amount;
        this.gatewayName = gatewayName;
        this.gatewayTransactionId = gatewayTransactionId;
    }
}
