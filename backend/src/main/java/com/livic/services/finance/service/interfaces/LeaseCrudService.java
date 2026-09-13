package com.livic.services.finance.service.interfaces;

import com.livic.platform.common.domain.LeaseStatus;
import com.livic.platform.common.service.interfaces.CrudService;
import com.livic.services.finance.domain.LeaseTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeaseCrudService extends CrudService<LeaseTbl, UUID> {
    Optional<LeaseTbl> findWithUnitAndPropertyById(UUID id);
    Optional<LeaseTbl> findByUserIdAndStatus(UUID userId, LeaseStatus status);
    boolean existsByUnitIdAndStatus(UUID unitId, LeaseStatus status);
    boolean existsActiveLeaseOnDate(UUID unitId, LeaseStatus status, LocalDate date);
    long countByUnitIdAndStatus(UUID unitId, LeaseStatus status);
    List<LeaseTbl> findByUnitIdAndStatus(UUID unitId, LeaseStatus status);
    List<LeaseTbl> findByUnitIdInAndStatus(Collection<UUID> unitIds, LeaseStatus status);
    boolean existsByUnitId(UUID unitId);
    Page<LeaseTbl> findByUnitIdInAndStatus(Collection<UUID> unitIds, LeaseStatus status, Pageable pageable);
    boolean existsByUnitIdIn(Collection<UUID> unitIds);
}
