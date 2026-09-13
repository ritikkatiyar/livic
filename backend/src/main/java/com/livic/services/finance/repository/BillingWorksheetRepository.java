package com.livic.services.finance.repository;

import com.livic.services.finance.domain.BillingWorksheetEntryTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BillingWorksheetRepository extends JpaRepository<BillingWorksheetEntryTbl, UUID> {
    
    List<BillingWorksheetEntryTbl> findAllByPropertyIdAndChargeConfigIdAndBillingMonth(
            UUID propertyId, UUID chargeConfigId, String billingMonth);
            
    Optional<BillingWorksheetEntryTbl> findByUnitIdAndChargeConfigIdAndBillingMonth(
            UUID unitId, UUID chargeConfigId, String billingMonth);

    List<BillingWorksheetEntryTbl> findByUnitIdInAndChargeConfigIdAndBillingMonth(
            Collection<UUID> unitIds, UUID chargeConfigId, String billingMonth);

    Page<BillingWorksheetEntryTbl> findByUnitIdInAndChargeConfigIdAndBillingMonth(
            Collection<UUID> unitIds, UUID chargeConfigId, String billingMonth, Pageable pageable);
            
    Optional<BillingWorksheetEntryTbl> findTopByUnitIdAndChargeConfigIdOrderByBillingMonthDesc(
            UUID unitId, UUID chargeConfigId);

    @Query("SELECT e FROM BillingWorksheetEntryTbl e LEFT JOIN FETCH e.chargeConfig WHERE e.unitId = :unitId AND e.billingMonth = :billingMonth")
    List<BillingWorksheetEntryTbl> findAllByUnitIdAndBillingMonth(
            @Param("unitId") UUID unitId, 
            @Param("billingMonth") String billingMonth);

    @Query(value = "SELECT e FROM BillingWorksheetEntryTbl e LEFT JOIN FETCH e.chargeConfig WHERE e.unitId = :unitId AND e.billingMonth = :billingMonth",
           countQuery = "SELECT count(e) FROM BillingWorksheetEntryTbl e WHERE e.unitId = :unitId AND e.billingMonth = :billingMonth")
    Page<BillingWorksheetEntryTbl> findAllByUnitIdAndBillingMonth(
            @Param("unitId") UUID unitId, 
            @Param("billingMonth") String billingMonth,
            Pageable pageable);

    @Query("SELECT e FROM BillingWorksheetEntryTbl e LEFT JOIN FETCH e.chargeConfig WHERE e.propertyId = :propertyId AND e.billingMonth = :billingMonth")
    List<BillingWorksheetEntryTbl> findAllByPropertyIdAndBillingMonth(
            @Param("propertyId") UUID propertyId, 
            @Param("billingMonth") String billingMonth);

    @Query(value = "SELECT e FROM BillingWorksheetEntryTbl e LEFT JOIN FETCH e.chargeConfig WHERE e.propertyId = :propertyId AND e.billingMonth = :billingMonth",
           countQuery = "SELECT count(e) FROM BillingWorksheetEntryTbl e WHERE e.propertyId = :propertyId AND e.billingMonth = :billingMonth")
    Page<BillingWorksheetEntryTbl> findAllByPropertyIdAndBillingMonth(
            @Param("propertyId") UUID propertyId, 
            @Param("billingMonth") String billingMonth,
            Pageable pageable);

    boolean existsByChargeConfigId(UUID chargeConfigId);

    @Query("SELECT e.unitId, e.enteredValue FROM BillingWorksheetEntryTbl e WHERE e.propertyId = :propertyId AND e.chargeConfig.id = :chargeConfigId AND e.billingMonth = (SELECT MAX(e2.billingMonth) FROM BillingWorksheetEntryTbl e2 WHERE e2.unitId = e.unitId AND e2.chargeConfig.id = :chargeConfigId AND e2.billingMonth < :billingMonth)")
    List<Object[]> findLatestValuesForPropertyAndConfig(
            @Param("propertyId") UUID propertyId, 
            @Param("chargeConfigId") UUID chargeConfigId, 
            @Param("billingMonth") String billingMonth);
}
