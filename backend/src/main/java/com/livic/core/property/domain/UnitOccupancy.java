package com.livic.core.property.domain;

/**
 * A unit's occupancy from its active members. Rented units are partly or fully occupied by their
 * tenants against bed capacity; a unit with members but no tenant (owner-occupied) has nothing to
 * let and counts as full; a unit with no one is vacant. Capacity counts tenants only.
 */
public enum UnitOccupancy {
    VACANT, PARTIAL, FULL;

    public static UnitOccupancy of(long tenants, long members, Integer capacity) {
        if (members <= 0) return VACANT;
        if (tenants <= 0) return FULL;
        return tenants < beds(capacity) ? PARTIAL : FULL;
    }

    /** Bed capacity; a missing capacity means 1. */
    public static int beds(Integer capacity) {
        return capacity == null || capacity < 1 ? 1 : capacity;
    }
}
