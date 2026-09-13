package com.livic.features.inventory.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record VerificationItemResponse(
        UUID id,
        UUID itemId,
        UUID leaseId,
        String name,
        String area,
        String icon,
        String moveInCondition,
        String returnCondition,
        String damageDescription,
        BigDecimal deduction,
        String status,
        String moveInPhoto,
        String returnPhoto,
        Instant returnedAt,
        Instant settledAt
) {}
