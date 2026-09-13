package com.livic.platform.payment.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
@ToString
public class PaymentInitiationRequest {
    private final UUID payerUserId;
    private final String referenceType; // e.g. "RENT_CYCLE", "SAAS_SUBSCRIPTION"
    private final UUID referenceId;
    private final BigDecimal amount;
    private final String paymentMethod; // e.g. "ONLINE", "CASH"
    private final String description;
    private final UUID confirmedBy; // For cash payments
    private final String note;
}
