package com.livic.verticals.rental.lease.facade;

import com.livic.verticals.rental.lease.dto.LeaseSummaryDTO;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Leases, for callers outside the lease package.
 *
 * <p>These methods used to hang off {@code FinanceFacade}, which put a rental contract in a
 * core facade and let anything in core read one. Only the rental vertical may depend on this;
 * core answers "who lives here" through {@code UnitMemberFacade} instead.
 */
public interface LeaseFacade {

    boolean isUnitOccupiedOnDate(UUID unitId, LocalDate date);

    Optional<LeaseSummaryDTO> getActiveLeaseForUser(UUID userId);

    List<LeaseSummaryDTO> getActiveLeasesByPropertyId(UUID propertyId);

    List<LeaseSummaryDTO> getActiveLeasesByUnitId(UUID unitId);

    Map<UUID, List<LeaseSummaryDTO>> getActiveLeasesByUnitIds(Collection<UUID> unitIds);

    boolean hasLeasesForProperty(UUID propertyId);

    boolean hasLeasesForUnit(UUID unitId);

    Optional<LeaseSummaryDTO> getLeaseById(UUID leaseId);
}
