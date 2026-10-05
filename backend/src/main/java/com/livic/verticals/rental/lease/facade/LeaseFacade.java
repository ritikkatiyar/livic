package com.livic.verticals.rental.lease.facade;

import com.livic.verticals.rental.lease.dto.LeaseSummaryDTO;

import java.time.LocalDate;
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

    /** Whether the unit has a free bed for a tenancy starting on that date. */
    boolean hasVacancyOnDate(UUID unitId, LocalDate date);

    Optional<LeaseSummaryDTO> getActiveLeaseForUser(UUID userId);

    Optional<LeaseSummaryDTO> getLeaseById(UUID leaseId);
}
