package com.livic.platform.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PaymentTransactionResponse(
        UUID id,
        UUID payerUserId,
        String paymentMethod,
        String referenceType,
        UUID referenceId,
        String gatewayName,
        String gatewayTransactionId,
        BigDecimal amount,
        String status,
        UUID confirmedBy,
        LocalDateTime confirmedAt,
        String note,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
