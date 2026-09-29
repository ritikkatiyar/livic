package com.livic.core.property.dto;

import java.util.UUID;

/**
 * Per-property occupancy, counted per unit: a shared room with two tenants is one occupied unit (and two
 * occupied beds), so {@code occupiedUnits <= totalUnits} and {@code occupiedBeds <= totalBeds} always hold.
 * {@code activeLeases} is the raw tenant count and can exceed {@code occupiedBeds} only for an overbooked unit.
 */
public record PropertyOccupancySummaryDTO(UUID propertyId, String propertyName,
                                          int vacantUnits, int partialUnits, int fullUnits,
                                          int totalBeds, int occupiedBeds, int activeLeases) {

    public int totalUnits() {
        return vacantUnits + partialUnits + fullUnits;
    }

    /** Units with at least one active lease. */
    public int occupiedUnits() {
        return partialUnits + fullUnits;
    }
}
