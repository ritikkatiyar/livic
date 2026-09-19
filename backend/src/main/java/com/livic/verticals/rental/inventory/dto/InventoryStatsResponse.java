package com.livic.verticals.rental.inventory.dto;

import java.math.BigDecimal;

public record InventoryStatsResponse(
        long totalAssets,
        long maintenanceDue,
        long unassigned,
        BigDecimal totalValuation
) {}
