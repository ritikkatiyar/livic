package com.livic.core.finance.service.impl;

import com.livic.platform.common.domain.LeaseStatus;
import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.core.finance.domain.LeaseTbl;
import com.livic.core.finance.repository.LeaseRepository;
import com.livic.core.finance.service.interfaces.LeaseCrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class LeaseCrudServiceImpl extends AbstractCrudService<LeaseTbl, UUID, LeaseRepository> implements LeaseCrudService {

    public LeaseCrudServiceImpl(LeaseRepository leaseRepository) {
        super(leaseRepository);
    }

    @Override
    public Optional<LeaseTbl> findWithUnitAndPropertyById(UUID id) {
        return repository.findById(id);
    }

    @Override
    public Optional<LeaseTbl> findByUserIdAndStatus(UUID userId, LeaseStatus status) {
        return repository.findByUserIdAndStatus(userId, status);
    }

    @Override
    public boolean existsByUnitIdAndStatus(UUID unitId, LeaseStatus status) {
        return repository.existsByUnitIdAndStatus(unitId, status);
    }

    @Override
    public boolean existsActiveLeaseOnDate(UUID unitId, LeaseStatus status, LocalDate date) {
        return repository.existsActiveLeaseOnDate(unitId, status, date);
    }

    @Override
    public long countByUnitIdAndStatus(UUID unitId, LeaseStatus status) {
        return repository.countByUnitIdAndStatus(unitId, status);
    }

    @Override
    public List<LeaseTbl> findByUnitIdAndStatus(UUID unitId, LeaseStatus status) {
        return repository.findByUnitIdAndStatus(unitId, status);
    }

    @Override
    public boolean existsByUnitId(UUID unitId) {
        return repository.existsByUnitId(unitId);
    }

    @Override
    public List<LeaseTbl> findByUnitIdInAndStatus(Collection<UUID> unitIds, LeaseStatus status) {
        if (unitIds == null || unitIds.isEmpty()) return List.of();
        return repository.findByUnitIdInAndStatus(unitIds, status);
    }

    @Override
    public Page<LeaseTbl> findByUnitIdInAndStatus(Collection<UUID> unitIds, LeaseStatus status, Pageable pageable) {
        if (unitIds == null || unitIds.isEmpty()) return Page.empty(pageable);
        return repository.findByUnitIdInAndStatus(unitIds, status, pageable);
    }

    @Override
    public boolean existsByUnitIdIn(Collection<UUID> unitIds) {
        if (unitIds == null || unitIds.isEmpty()) return false;
        return repository.existsByUnitIdIn(unitIds);
    }
}
