package com.livic.features.inventory.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ServiceExpenseResponse(
        UUID id,
        UUID itemId,
        UUID propertyId,
        String vendorName,
        LocalDate serviceDate,
        BigDecimal amount,
        String description,
        LocalDate nextServiceDate,
        UUID recordedBy,
        Instant createdAt
) {}
