package com.livic.core.community.analytics.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Occupancy of one property. Unit fields count rooms (a shared room with any tenant is one occupied unit,
 * and so is an owner-occupied flat); bed fields count tenants against capacity. Both rates are percentages
 * in [0, 100].
 */
public record PortfolioOccupancyResponse(
        UUID propertyId,
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
        int activeTenants
) {}
