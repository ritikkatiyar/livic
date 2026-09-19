package com.livic.core.property.domain;

/**
 * How a person is attached to a unit. The role decides what they may do on that unit,
 * independently of any property-level membership.
 */
public enum UnitMemberRole {
    /** Owns the flat. Pays maintenance, and may rent it out. */
    OWNER,
    /** Rents the unit under a lease. */
    TENANT,
    /** Lives there with the owner or tenant; no contract of their own. */
    FAMILY
}
