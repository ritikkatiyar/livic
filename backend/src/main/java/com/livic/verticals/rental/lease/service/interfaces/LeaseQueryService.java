package com.livic.verticals.rental.lease.service.interfaces;

import com.livic.verticals.rental.lease.domain.LeaseStatus;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeaseQueryService {
    LeaseTbl getLeaseById(UUID id);
    Optional<LeaseTbl> findByUserIdAndStatus(UUID userId, LeaseStatus status);
    List<LeaseTbl> findByUnitIdAndStatus(UUID unitId, LeaseStatus status);
    List<LeaseTbl> findActiveLeasesByProperty(UUID propertyId);
    Page<LeaseTbl> findActiveLeasesByProperty(UUID propertyId, Pageable pageable);
    /** Whether the unit has a free bed on that date: its capacity, less the tenancies running then. */
    boolean isUnitAvailableOnDate(UUID unitId, LocalDate date);
}
