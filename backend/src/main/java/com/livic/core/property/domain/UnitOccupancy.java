package com.livic.core.property.domain;

/** Unit occupancy state from its active lease count and bed capacity (a missing capacity means 1). */
public enum UnitOccupancy {
    VACANT, PARTIAL, FULL;

    public static UnitOccupancy of(long activeLeases, Integer capacity) {
        int beds = beds(capacity);
        if (activeLeases <= 0) return VACANT;
        return activeLeases < beds ? PARTIAL : FULL;
    }

    public static int beds(Integer capacity) {
        return capacity == null || capacity < 1 ? 1 : capacity;
    }
}
