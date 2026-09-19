package com.livic.core.finance.service.interfaces;

import com.livic.core.finance.domain.RentCycleChargeTbl;
import com.livic.platform.common.service.interfaces.CrudService;

import java.util.List;
import java.util.UUID;

public interface RentCycleChargeCrudService extends CrudService<RentCycleChargeTbl, UUID> {
    List<RentCycleChargeTbl> findByRentCycle_Id(UUID rentCycleId);
    List<RentCycleChargeTbl> findByRentCycle_IdIn(java.util.Collection<UUID> rentCycleIds);
    boolean existsByCustomChargeConfigId(UUID customChargeConfigId);
}
