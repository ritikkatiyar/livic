package com.livic.services.finance.service.impl;

import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.services.finance.domain.RentCycleChargeTbl;
import com.livic.services.finance.repository.RentCycleChargeRepository;
import com.livic.services.finance.service.interfaces.RentCycleChargeCrudService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class RentCycleChargeCrudServiceImpl extends AbstractCrudService<RentCycleChargeTbl, UUID, RentCycleChargeRepository> implements RentCycleChargeCrudService {

    public RentCycleChargeCrudServiceImpl(RentCycleChargeRepository repository) {
        super(repository);
    }

    @Override
    public List<RentCycleChargeTbl> findByRentCycle_Id(UUID rentCycleId) {
        return repository.findByRentCycle_Id(rentCycleId);
    }

    @Override
    public List<RentCycleChargeTbl> findByRentCycle_IdIn(java.util.Collection<UUID> rentCycleIds) {
        if (rentCycleIds == null || rentCycleIds.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return repository.findByRentCycle_IdIn(rentCycleIds);
    }

    @Override
    public boolean existsByCustomChargeConfigId(UUID customChargeConfigId) {
        return repository.existsByCustomChargeConfigId(customChargeConfigId);
    }
}
