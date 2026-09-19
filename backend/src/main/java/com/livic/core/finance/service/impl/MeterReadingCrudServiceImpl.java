package com.livic.core.finance.service.impl;

import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.core.finance.domain.MeterReadingTbl;
import com.livic.core.finance.repository.MeterReadingRepository;
import com.livic.core.finance.service.interfaces.MeterReadingCrudService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class MeterReadingCrudServiceImpl extends AbstractCrudService<MeterReadingTbl, UUID, MeterReadingRepository> implements MeterReadingCrudService {

    public MeterReadingCrudServiceImpl(MeterReadingRepository meterReadingRepository) {
        super(meterReadingRepository);
    }

    @Override
    public List<MeterReadingTbl> findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(
            UUID propertyId, UUID chargeConfigId, Integer billingMonth, Integer billingYear) {
        return repository.findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(
                propertyId, chargeConfigId, billingMonth, billingYear);
    }

    @Override
    public Optional<MeterReadingTbl> findByUnitIdAndChargeConfigIdAndBillingMonthAndBillingYear(
            UUID unitId, UUID chargeConfigId, Integer billingMonth, Integer billingYear) {
        return repository.findByUnitIdAndChargeConfigIdAndBillingMonthAndBillingYear(
                unitId, chargeConfigId, billingMonth, billingYear);
    }

    @Override
    public Optional<MeterReadingTbl> findTopByUnitIdAndChargeConfigIdOrderByBillingYearDescBillingMonthDesc(
            UUID unitId, UUID chargeConfigId) {
        return repository.findTopByUnitIdAndChargeConfigIdOrderByBillingYearDescBillingMonthDesc(
                unitId, chargeConfigId);
    }

    @Override
    public List<MeterReadingTbl> findAllByUnitIdAndBillingMonthAndBillingYear(
            UUID unitId, Integer billingMonth, Integer billingYear) {
        return repository.findAllByUnitIdAndBillingMonthAndBillingYear(
                unitId, billingMonth, billingYear);
    }

    @Override
    public List<MeterReadingTbl> findByUnitIdInAndChargeConfigIdAndBillingMonthAndBillingYear(
            Collection<UUID> unitIds, UUID chargeConfigId, Integer billingMonth, Integer billingYear) {
        return repository.findByUnitIdInAndChargeConfigIdAndBillingMonthAndBillingYear(
                unitIds, chargeConfigId, billingMonth, billingYear);
    }

    @Override
    public List<MeterReadingTbl> findByPropertyIdAndBillingMonthAndBillingYear(
            UUID propertyId, Integer billingMonth, Integer billingYear) {
        return repository.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, billingMonth, billingYear);
    }

    @Override
    public List<MeterReadingTbl> findByPropertyIdAndChargeConfigId(UUID propertyId, UUID chargeConfigId) {
        return repository.findByPropertyIdAndChargeConfigId(propertyId, chargeConfigId);
    }

    @Override
    public boolean existsByChargeConfigId(UUID chargeConfigId) {
        return repository.existsByChargeConfigId(chargeConfigId);
    }
}
