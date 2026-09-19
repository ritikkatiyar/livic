package com.livic.verticals.rental.inventory.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record InventoryItemResponse(
        UUID id,
        UUID propertyId,
        UUID unitId,
        String name,
        String category,
        String location,
        String serial,
        String modelNumber,
        String condition,
        String status,
        String nextService,
        BigDecimal value,
        boolean shared,
        String icon,
        String image,
        String notes,
        Instant createdAt
) {}
