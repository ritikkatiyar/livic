package com.livic.features.inventory.dto;

import java.math.BigDecimal;

public record InventoryPropertyMetricsDTO(
        long totalAssets,
        long maintenanceDue,
        long unassigned,
        BigDecimal totalValuation
) {}
