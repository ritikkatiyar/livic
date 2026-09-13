package com.livic.platform.payment.event;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.util.UUID;

@Getter
@Builder
@ToString
public class PaymentFailedEvent {
    private final UUID transactionId;
    private final String referenceType;
    private final UUID referenceId;
    private final UUID payerUserId;
    private final String gatewayName;
    private final String failureReason;
}
