package com.livic.core.finance.service.interfaces;

import com.livic.core.finance.domain.BillingWorksheetEntryTbl;
import com.livic.platform.common.service.interfaces.CrudService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BillingWorksheetCrudService extends CrudService<BillingWorksheetEntryTbl, UUID> {
    List<BillingWorksheetEntryTbl> findAllByPropertyIdAndChargeConfigIdAndBillingMonth(
            UUID propertyId, UUID chargeConfigId, String billingMonth);
            
    Optional<BillingWorksheetEntryTbl> findByUnitIdAndChargeConfigIdAndBillingMonth(
            UUID unitId, UUID chargeConfigId, String billingMonth);
            
    Optional<BillingWorksheetEntryTbl> findTopByUnitIdAndChargeConfigIdOrderByBillingMonthDesc(
            UUID unitId, UUID chargeConfigId);

    List<BillingWorksheetEntryTbl> findAllByUnitIdAndBillingMonth(
            UUID unitId, String billingMonth);

    Page<BillingWorksheetEntryTbl> findAllByUnitIdAndBillingMonth(
            UUID unitId, String billingMonth, Pageable pageable);

    List<BillingWorksheetEntryTbl> findAllByPropertyIdAndBillingMonth(
            UUID propertyId, String billingMonth);

    Page<BillingWorksheetEntryTbl> findAllByPropertyIdAndBillingMonth(
            UUID propertyId, String billingMonth, Pageable pageable);

    boolean existsByChargeConfigId(UUID chargeConfigId);

    List<Object[]> findLatestValuesForPropertyAndConfig(
            UUID propertyId, UUID chargeConfigId, String billingMonth);

    List<BillingWorksheetEntryTbl> findByUnitIdInAndChargeConfigIdAndBillingMonth(
            Collection<UUID> unitIds, UUID chargeConfigId, String billingMonth);

    Page<BillingWorksheetEntryTbl> findByUnitIdInAndChargeConfigIdAndBillingMonth(
            Collection<UUID> unitIds, UUID chargeConfigId, String billingMonth, Pageable pageable);
}
