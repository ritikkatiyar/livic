package com.livic.core.community.analytics.dto;

import java.math.BigDecimal;

/**
 * Occupancy of one property. Unit fields count rooms (a shared room with any tenant is one occupied unit);
 * bed fields count capacity. Both rates are percentages in [0, 100]. {@code activeLeases} is the tenant count.
 */
public record PortfolioOccupancyResponse(
        String propertyId,
        String propertyName,
        int totalUnits,
        int occupiedUnits,
        BigDecimal occupancyRate,
        BigDecimal netYield,
        int vacantUnits,
        int partialUnits,
        int fullUnits,
        int totalBeds,
        int occupiedBeds,
        BigDecimal bedOccupancyRate,
        int activeLeases
) {}
