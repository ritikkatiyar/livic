package com.livic.core.finance.repository;

import com.livic.core.finance.domain.MeterReadingTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MeterReadingRepository extends JpaRepository<MeterReadingTbl, UUID> {
    
    List<MeterReadingTbl> findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(
            UUID propertyId, UUID chargeConfigId, Integer billingMonth, Integer billingYear);
            
    Optional<MeterReadingTbl> findByUnitIdAndChargeConfigIdAndBillingMonthAndBillingYear(
            UUID unitId, UUID chargeConfigId, Integer billingMonth, Integer billingYear);
            
    Optional<MeterReadingTbl> findTopByUnitIdAndChargeConfigIdOrderByBillingYearDescBillingMonthDesc(
            UUID unitId, UUID chargeConfigId);

    List<MeterReadingTbl> findAllByUnitIdAndBillingMonthAndBillingYear(
            UUID unitId, Integer billingMonth, Integer billingYear);

    List<MeterReadingTbl> findByUnitIdInAndChargeConfigIdAndBillingMonthAndBillingYear(
            java.util.Collection<UUID> unitIds, UUID chargeConfigId, Integer billingMonth, Integer billingYear);

    List<MeterReadingTbl> findByPropertyIdAndBillingMonthAndBillingYear(
            UUID propertyId, Integer billingMonth, Integer billingYear);

    List<MeterReadingTbl> findByPropertyIdAndChargeConfigId(UUID propertyId, UUID chargeConfigId);

    boolean existsByChargeConfigId(UUID chargeConfigId);
}
