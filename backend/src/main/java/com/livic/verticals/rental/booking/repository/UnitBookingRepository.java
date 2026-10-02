package com.livic.verticals.rental.booking.repository;

import com.livic.verticals.rental.booking.domain.UnitBookingTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UnitBookingRepository extends JpaRepository<UnitBookingTbl, UUID> {
    Optional<UnitBookingTbl> findByStatusAndConvertedLeaseId(String status, UUID convertedLeaseId);
    Page<UnitBookingTbl> findByUnitIdIn(Collection<UUID> unitIds, Pageable pageable);
    Page<UnitBookingTbl> findByProspectiveTenantUserId(UUID prospectiveTenantUserId, Pageable pageable);
}
