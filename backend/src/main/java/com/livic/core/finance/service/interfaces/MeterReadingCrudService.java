package com.livic.core.finance.service.interfaces;

import com.livic.platform.common.service.interfaces.CrudService;
import com.livic.core.finance.domain.MeterReadingTbl;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MeterReadingCrudService extends CrudService<MeterReadingTbl, UUID> {
    List<MeterReadingTbl> findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(
            UUID propertyId, UUID chargeConfigId, Integer billingMonth, Integer billingYear);
            
    Optional<MeterReadingTbl> findByUnitIdAndChargeConfigIdAndBillingMonthAndBillingYear(
            UUID unitId, UUID chargeConfigId, Integer billingMonth, Integer billingYear);
            
    Optional<MeterReadingTbl> findTopByUnitIdAndChargeConfigIdOrderByBillingYearDescBillingMonthDesc(
            UUID unitId, UUID chargeConfigId);

    List<MeterReadingTbl> findAllByUnitIdAndBillingMonthAndBillingYear(
            UUID unitId, Integer billingMonth, Integer billingYear);

    List<MeterReadingTbl> findByUnitIdInAndChargeConfigIdAndBillingMonthAndBillingYear(
            Collection<UUID> unitIds, UUID chargeConfigId, Integer billingMonth, Integer billingYear);

    List<MeterReadingTbl> findByPropertyIdAndBillingMonthAndBillingYear(
            UUID propertyId, Integer billingMonth, Integer billingYear);

    List<MeterReadingTbl> findByPropertyIdAndChargeConfigId(UUID propertyId, UUID chargeConfigId);

    boolean existsByChargeConfigId(UUID chargeConfigId);
}
