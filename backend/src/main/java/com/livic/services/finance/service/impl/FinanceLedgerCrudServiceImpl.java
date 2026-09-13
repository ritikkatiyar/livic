package com.livic.services.finance.service.impl;

import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.services.finance.domain.FinanceLedgerTbl;
import com.livic.services.finance.repository.FinanceLedgerRepository;
import com.livic.services.finance.service.interfaces.FinanceLedgerCrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Service
public class FinanceLedgerCrudServiceImpl extends AbstractCrudService<FinanceLedgerTbl, UUID, FinanceLedgerRepository> implements FinanceLedgerCrudService {

    public FinanceLedgerCrudServiceImpl(FinanceLedgerRepository repository) {
        super(repository);
    }

    @Override
    public Page<FinanceLedgerTbl> findAll(Specification<FinanceLedgerTbl> spec, Pageable pageable) {
        return repository.findAll(spec, pageable);
    }

    @Override
    public BigDecimal getRunningBalanceForLeaseAtEntry(UUID leaseId, LocalDateTime createdAt, UUID id) {
        return repository.getRunningBalanceForLeaseAtEntry(leaseId, createdAt, id);
    }

    @Override
    public List<Object[]> getRunningBalancesForEntries(Collection<UUID> ids) {
        return repository.getRunningBalancesForEntries(ids);
    }

    @Override
    public BigDecimal sumAmountByLeaseId(UUID leaseId) {
        return repository.sumAmountByLeaseId(leaseId);
    }
}
