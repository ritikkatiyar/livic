package com.livic.core.finance.service.impl;

import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.core.finance.domain.BillLineTbl;
import com.livic.core.finance.repository.BillLineRepository;
import com.livic.core.finance.service.interfaces.BillLineCrudService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class BillLineCrudServiceImpl extends AbstractCrudService<BillLineTbl, UUID, BillLineRepository> implements BillLineCrudService {

    public BillLineCrudServiceImpl(BillLineRepository repository) {
        super(repository);
    }

    @Override
    public List<BillLineTbl> findByBill_Id(UUID billId) {
        return repository.findByBill_Id(billId);
    }

    @Override
    public List<BillLineTbl> findByBill_IdIn(java.util.Collection<UUID> billIds) {
        if (billIds == null || billIds.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return repository.findByBill_IdIn(billIds);
    }

    @Override
    public boolean existsByCustomChargeConfigId(UUID customChargeConfigId) {
        return repository.existsByCustomChargeConfigId(customChargeConfigId);
    }
}
