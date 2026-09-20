package com.livic.core.property.spi;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Lease occupancy the property module needs for layouts and deletion guards.
 * Defined here and implemented by the module that owns leases, so property does not depend on it.
 */
public interface UnitOccupancyProvider {

    Map<UUID, List<UnitOccupant>> activeOccupantsByUnitIds(Collection<UUID> unitIds);

    /** Units whose active lease has a move-out date. */
    Set<UUID> vacatingUnitIds(UUID propertyId);

    /** Whether the unit has room for a new tenancy starting on that date. */
    boolean isUnitAvailableOnDate(UUID unitId, java.time.LocalDate date);

    boolean hasLeasesForUnit(UUID unitId);

    boolean hasLeasesForProperty(UUID propertyId);

    record UnitOccupant(UUID leaseId, UUID userId, BigDecimal rentAmount, String status) {
    }
}
