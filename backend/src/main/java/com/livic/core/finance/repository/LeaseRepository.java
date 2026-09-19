package com.livic.core.finance.repository;

import com.livic.platform.common.domain.LeaseStatus;
import com.livic.core.finance.domain.LeaseTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaseRepository extends JpaRepository<LeaseTbl, UUID> {

    Optional<LeaseTbl> findByUserIdAndStatus(UUID userId, LeaseStatus status);

    boolean existsByUnitIdAndStatus(UUID unitId, LeaseStatus status);

    @Query("SELECT COUNT(l) > 0 FROM LeaseTbl l WHERE l.unitId = :unitId AND l.status = :status " +
           "AND l.moveInDate <= :date AND (l.moveOutDate IS NULL OR l.moveOutDate > :date)")
    boolean existsActiveLeaseOnDate(
            @Param("unitId") UUID unitId,
            @Param("status") LeaseStatus status,
            @Param("date") LocalDate date
    );

    long countByUnitIdAndStatus(UUID unitId, LeaseStatus status);

    List<LeaseTbl> findByUnitIdAndStatus(UUID unitId, LeaseStatus status);

    List<LeaseTbl> findByUnitIdInAndStatus(Collection<UUID> unitIds, LeaseStatus status);

    Page<LeaseTbl> findByUnitIdInAndStatus(Collection<UUID> unitIds, LeaseStatus status, Pageable pageable);

    boolean existsByUnitId(UUID unitId);

    boolean existsByUnitIdIn(Collection<UUID> unitIds);
}
