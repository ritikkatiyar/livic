package com.livic.core.finance.service.impl;

import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.core.finance.domain.BillingWorksheetEntryTbl;
import com.livic.core.finance.repository.BillingWorksheetRepository;
import com.livic.core.finance.service.interfaces.BillingWorksheetCrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BillingWorksheetCrudServiceImpl extends AbstractCrudService<BillingWorksheetEntryTbl, UUID, BillingWorksheetRepository> implements BillingWorksheetCrudService {

    public BillingWorksheetCrudServiceImpl(BillingWorksheetRepository repository) {
        super(repository);
    }

    @Override
    public List<BillingWorksheetEntryTbl> findAllByPropertyIdAndChargeConfigIdAndBillingMonth(
            UUID propertyId, UUID chargeConfigId, String billingMonth) {
        return repository.findAllByPropertyIdAndChargeConfigIdAndBillingMonth(propertyId, chargeConfigId, billingMonth);
    }

    @Override
    public Optional<BillingWorksheetEntryTbl> findByUnitIdAndChargeConfigIdAndBillingMonth(
            UUID unitId, UUID chargeConfigId, String billingMonth) {
        return repository.findByUnitIdAndChargeConfigIdAndBillingMonth(unitId, chargeConfigId, billingMonth);
    }

    @Override
    public Optional<BillingWorksheetEntryTbl> findTopByUnitIdAndChargeConfigIdOrderByBillingMonthDesc(
            UUID unitId, UUID chargeConfigId) {
        return repository.findTopByUnitIdAndChargeConfigIdOrderByBillingMonthDesc(unitId, chargeConfigId);
    }

    @Override
    public List<BillingWorksheetEntryTbl> findAllByUnitIdAndBillingMonth(UUID unitId, String billingMonth) {
        return repository.findAllByUnitIdAndBillingMonth(unitId, billingMonth);
    }

    @Override
    public Page<BillingWorksheetEntryTbl> findAllByUnitIdAndBillingMonth(UUID unitId, String billingMonth, Pageable pageable) {
        return repository.findAllByUnitIdAndBillingMonth(unitId, billingMonth, pageable);
    }

    @Override
    public List<BillingWorksheetEntryTbl> findAllByPropertyIdAndBillingMonth(UUID propertyId, String billingMonth) {
        return repository.findAllByPropertyIdAndBillingMonth(propertyId, billingMonth);
    }

    @Override
    public Page<BillingWorksheetEntryTbl> findAllByPropertyIdAndBillingMonth(UUID propertyId, String billingMonth, Pageable pageable) {
        return repository.findAllByPropertyIdAndBillingMonth(propertyId, billingMonth, pageable);
    }

    @Override
    public boolean existsByChargeConfigId(UUID chargeConfigId) {
        return repository.existsByChargeConfigId(chargeConfigId);
    }

    @Override
    public List<Object[]> findLatestValuesForPropertyAndConfig(UUID propertyId, UUID chargeConfigId, String billingMonth) {
        return repository.findLatestValuesForPropertyAndConfig(propertyId, chargeConfigId, billingMonth);
    }

    @Override
    public List<BillingWorksheetEntryTbl> findByUnitIdInAndChargeConfigIdAndBillingMonth(Collection<UUID> unitIds, UUID chargeConfigId, String billingMonth) {
        return repository.findByUnitIdInAndChargeConfigIdAndBillingMonth(unitIds, chargeConfigId, billingMonth);
    }

    @Override
    public Page<BillingWorksheetEntryTbl> findByUnitIdInAndChargeConfigIdAndBillingMonth(Collection<UUID> unitIds, UUID chargeConfigId, String billingMonth, Pageable pageable) {
        return repository.findByUnitIdInAndChargeConfigIdAndBillingMonth(unitIds, chargeConfigId, billingMonth, pageable);
    }
}
