package com.livic.core.property.dto;

import java.util.UUID;

/**
 * Per-property occupancy, counted per unit: a shared room with two tenants is one occupied unit (and two
 * occupied beds), so {@code occupiedUnits <= totalUnits} and {@code occupiedBeds <= totalBeds} always hold.
 * Beds count tenants only; an owner-occupied unit is occupied with its beds free. {@code activeTenants}
 * is the raw tenant count and can exceed {@code occupiedBeds} only for an overbooked unit.
 */
public record PropertyOccupancySummaryDTO(UUID propertyId, String propertyName,
                                          int vacantUnits, int partialUnits, int fullUnits,
                                          int totalBeds, int occupiedBeds, int activeTenants) {

    public int totalUnits() {
        return vacantUnits + partialUnits + fullUnits;
    }

    /** Units with at least one active member. */
    public int occupiedUnits() {
        return partialUnits + fullUnits;
    }
}
