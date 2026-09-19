package com.livic.core.community.analytics.dto;

import java.math.BigDecimal;

public record PortfolioOccupancyResponse(
        String propertyId,
        String propertyName,
        int totalUnits,
        int occupiedUnits,
        BigDecimal occupancyRate,
        BigDecimal netYield
) {}
