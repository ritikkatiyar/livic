package com.livic.platform.payment.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@ToString
public class PaymentInitiationResponse {
    private final UUID transactionId;
    private final String gatewayName;
    private final String gatewayTransactionId; // Razorpay Order ID / Intent ID
    private final BigDecimal amount;
    private final String currency;
    private final String status;
    private final String paymentMethod;
    private final LocalDateTime createdAt;
}
