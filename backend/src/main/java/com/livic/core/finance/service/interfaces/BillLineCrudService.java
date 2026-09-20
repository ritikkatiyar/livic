package com.livic.core.finance.service.interfaces;

import com.livic.core.finance.domain.BillLineTbl;
import com.livic.platform.common.service.interfaces.CrudService;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface BillLineCrudService extends CrudService<BillLineTbl, UUID> {
    List<BillLineTbl> findByBill_Id(UUID billId);
    List<BillLineTbl> findByBill_IdIn(Collection<UUID> billIds);
    boolean existsByCustomChargeConfigId(UUID customChargeConfigId);
}
