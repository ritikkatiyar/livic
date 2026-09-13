package com.livic.services.finance.service.impl;

import com.livic.platform.common.domain.CalculationStrategyType;
import com.livic.platform.common.domain.ChargeCategory;
import com.livic.platform.common.domain.LedgerTransactionType;
import com.livic.platform.common.domain.LeaseStatus;
import com.livic.platform.common.domain.RentChargeType;
import com.livic.platform.common.domain.UnitBookingStatus;
import com.livic.platform.common.exception.BusinessException;
import com.livic.services.finance.domain.BillingWorksheetEntryTbl;
import com.livic.services.finance.domain.ChargeConfigTbl;
import com.livic.services.finance.domain.FinanceLedgerTbl;
import com.livic.services.finance.domain.LeaseTbl;
import com.livic.services.finance.domain.RentCycleChargeTbl;
import com.livic.services.finance.domain.RentCycleStatus;
import com.livic.services.finance.domain.RentCycleTbl;
import com.livic.services.finance.domain.UnitBookingTbl;
import com.livic.services.finance.dto.RentCycleDTOs;
import com.livic.services.finance.service.interfaces.BillingWorksheetCrudService;
import com.livic.services.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.services.finance.service.interfaces.FinanceLedgerCrudService;
import com.livic.services.finance.service.interfaces.LeaseCrudService;
import com.livic.services.finance.service.interfaces.RentCycleChargeCrudService;
import com.livic.services.finance.service.interfaces.RentCycleCrudService;
import com.livic.services.finance.service.interfaces.RentCycleService;
import com.livic.services.finance.service.interfaces.UnitBookingCrudService;
import com.livic.services.finance.strategy.CalculationResult;
import com.livic.services.finance.strategy.ChargeCalculationService;
import com.livic.services.property.dto.UnitSummaryDTO;
import com.livic.services.property.facade.UnitFacade;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Dedicated helper component providing {@code REQUIRES_NEW} transactional boundaries
 * for batch operations and encapsulating core rent cycle generation logic.
 * Uses strict constructor injection.
 */
@Service
@Slf4j
public class RentCycleTransactionHelper {

    private final RentCycleCrudService rentCycleCrudService;
    private final RentCycleChargeCrudService rentCycleChargeCrudService;
    private final UnitFacade unitFacade;
    private final BillingWorksheetCrudService billingWorksheetCrudService;
    private final LeaseCrudService leaseCrudService;
    private final ChargeConfigCrudService chargeConfigCrudService;
    private final ChargeCalculationService chargeCalculationService;
    private final UnitBookingCrudService unitBookingCrudService;
    private final FinanceLedgerCrudService financeLedgerCrudService;
    private final RentCycleService rentCycleService;

    public RentCycleTransactionHelper(
            RentCycleCrudService rentCycleCrudService,
            RentCycleChargeCrudService rentCycleChargeCrudService,
            UnitFacade unitFacade,
            BillingWorksheetCrudService billingWorksheetCrudService,
            LeaseCrudService leaseCrudService,
            ChargeConfigCrudService chargeConfigCrudService,
            ChargeCalculationService chargeCalculationService,
            UnitBookingCrudService unitBookingCrudService,
            FinanceLedgerCrudService financeLedgerCrudService,
            @Lazy RentCycleService rentCycleService
    ) {
        this.rentCycleCrudService = rentCycleCrudService;
        this.rentCycleChargeCrudService = rentCycleChargeCrudService;
        this.unitFacade = unitFacade;
        this.billingWorksheetCrudService = billingWorksheetCrudService;
        this.leaseCrudService = leaseCrudService;
        this.chargeConfigCrudService = chargeConfigCrudService;
        this.chargeCalculationService = chargeCalculationService;
        this.unitBookingCrudService = unitBookingCrudService;
        this.financeLedgerCrudService = financeLedgerCrudService;
        this.rentCycleService = rentCycleService;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RentCycleTbl generateSingleInTransaction(LeaseTbl lease, String billingMonthStr, LocalDate dueDate, Map<UUID, Integer> roommateCounts) {
        return processLeaseGeneration(lease, billingMonthStr, dueDate, roommateCounts, null, null, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RentCycleTbl generateSingleInTransaction(
            LeaseTbl lease,
            String billingMonthStr,
            LocalDate dueDate,
            Map<UUID, Integer> roommateCounts,
            List<BillingWorksheetEntryTbl> propertyWorksheets,
            List<ChargeConfigTbl> propertyActiveConfigs,
            Map<UUID, String> unitNumbers
    ) {
        return processLeaseGeneration(lease, billingMonthStr, dueDate, roommateCounts, propertyWorksheets, propertyActiveConfigs, unitNumbers);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RentCycleDTOs.RentCycleResponse publishSingleInTransaction(UUID id) {
        return rentCycleService.publish(id);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RentCycleDTOs.RentCycleResponse unpublishSingleInTransaction(UUID id) {
        return rentCycleService.unpublish(id);
    }

    public RentCycleTbl processLeaseGeneration(LeaseTbl lease, String billingMonthStr, LocalDate dueDate, Map<UUID, Integer> roommateCounts) {
        return processLeaseGeneration(lease, billingMonthStr, dueDate, roommateCounts, null, null, null);
    }

    public RentCycleTbl processLeaseGeneration(
            LeaseTbl lease,
            String billingMonthStr,
            LocalDate dueDate,
            Map<UUID, Integer> roommateCounts,
            List<BillingWorksheetEntryTbl> propertyWorksheets,
            List<ChargeConfigTbl> propertyActiveConfigs,
            Map<UUID, String> unitNumbers
    ) {
        Optional<RentCycleTbl> existingCycleOpt = rentCycleCrudService.findByLease_IdAndBillingMonth(lease.getId(), billingMonthStr);
        RentCycleTbl cycle;
        BigDecimal previousTotal = BigDecimal.ZERO;

        if (existingCycleOpt.isPresent()) {
            cycle = existingCycleOpt.get();
            if (cycle.getStatus() == RentCycleStatus.PAID) {
                String unitNum = (unitNumbers != null && unitNumbers.containsKey(lease.getUnitId()))
                        ? unitNumbers.get(lease.getUnitId())
                        : unitFacade.getUnitById(lease.getUnitId()).map(UnitSummaryDTO::unitNumber).orElse("N/A");
                throw new BusinessException(HttpStatus.CONFLICT, "Cannot regenerate a paid rent cycle for unit " + unitNum);
            }
            previousTotal = cycle.getTotalAmount();
            List<RentCycleChargeTbl> existingCharges = rentCycleChargeCrudService.findByRentCycle_Id(cycle.getId());
            rentCycleChargeCrudService.deleteAll(existingCharges);
        } else {
            cycle = RentCycleTbl.builder()
                    .lease(lease)
                    .billingMonth(billingMonthStr)
                    .dueDate(dueDate)
                    .totalAmount(BigDecimal.ZERO)
                    .status(RentCycleStatus.PENDING)
                    .build();
            cycle = rentCycleCrudService.save(cycle);
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<RentCycleChargeTbl> chargesToSave = new ArrayList<>();

        BigDecimal baseRentAmount = lease.getMonthlyRentAmount() != null ? lease.getMonthlyRentAmount() : BigDecimal.ZERO;

        List<BillingWorksheetEntryTbl> worksheetEntries = propertyWorksheets;
        if (worksheetEntries == null) {
            UnitSummaryDTO unitSummary = unitFacade.getUnitById(lease.getUnitId()).orElse(null);
            UUID propertyId = unitSummary != null ? unitSummary.propertyId() : null;
            worksheetEntries = propertyId == null ? List.of() :
                    billingWorksheetCrudService.findAllByPropertyIdAndBillingMonth(propertyId, billingMonthStr);
        }

        Optional<BillingWorksheetEntryTbl> rentWorksheetOpt = worksheetEntries.stream()
                .filter(w -> w.getUnitId() != null && w.getUnitId().equals(lease.getUnitId()))
                .filter(w -> w.getChargeConfig() != null && w.getChargeConfig().getChargeCategory() == ChargeCategory.RENT)
                .findFirst();
        if (rentWorksheetOpt.isPresent() && rentWorksheetOpt.get().getEnteredValue() != null) {
            baseRentAmount = rentWorksheetOpt.get().getEnteredValue();
        }

        if (baseRentAmount != null && baseRentAmount.compareTo(BigDecimal.ZERO) > 0) {
            RentCycleChargeTbl rentCharge = RentCycleChargeTbl.builder()
                    .rentCycle(cycle)
                    .chargeType(RentChargeType.BASE_RENT)
                    .customChargeConfig(null)
                    .amount(baseRentAmount)
                    .description("Base Rent")
                    .build();
            chargesToSave.add(rentCharge);
            totalAmount = totalAmount.add(baseRentAmount);
        }

        int roommateCount = 1;
        if (roommateCounts != null && roommateCounts.containsKey(lease.getUnitId())) {
            roommateCount = roommateCounts.get(lease.getUnitId());
        } else {
            roommateCount = Math.max(1, (int) leaseCrudService.countByUnitIdAndStatus(lease.getUnitId(), LeaseStatus.ACTIVE));
        }

        List<ChargeConfigTbl> activeConfigs = propertyActiveConfigs;
        if (activeConfigs == null) {
            UnitSummaryDTO unitSummary = unitFacade.getUnitById(lease.getUnitId()).orElse(null);
            UUID propertyId = unitSummary != null ? unitSummary.propertyId() : null;
            activeConfigs = propertyId == null ? List.of() :
                    chargeConfigCrudService.findAllByPropertyIdAndIsActiveTrue(propertyId);
        }

        for (ChargeConfigTbl config : activeConfigs) {
            if (config.getChargeCategory() == ChargeCategory.RENT) {
                continue;
            }
            CalculationResult result = chargeCalculationService.executeChargePipeline(config, lease.getUnitId(), billingMonthStr, false);

            BigDecimal chargeAmount = result.amount();
            if (chargeAmount.compareTo(BigDecimal.ZERO) == 0) {
                continue;
            }

            if (roommateCount > 1) {
                chargeAmount = chargeAmount.divide(BigDecimal.valueOf(roommateCount), 2, RoundingMode.HALF_UP);
            }

            RentChargeType chargeType = mapCategoryToType(config.getChargeCategory());
            String desc = config.getChargeName();
            if (result.descriptionDetail() != null) {
                desc += " (" + result.descriptionDetail() + ")";
            }

            RentCycleChargeTbl charge = RentCycleChargeTbl.builder()
                    .rentCycle(cycle)
                    .chargeType(chargeType)
                    .customChargeConfig(config)
                    .amount(chargeAmount)
                    .description(desc)
                    .build();
            chargesToSave.add(charge);

            if (chargeType == RentChargeType.DISCOUNT) {
                totalAmount = totalAmount.subtract(chargeAmount);
            } else {
                totalAmount = totalAmount.add(chargeAmount);
            }
        }

        List<RentCycleTbl> existingCycles = rentCycleCrudService.findByLease_Id(lease.getId());
        final UUID currentCycleId = cycle.getId();
        long priorCyclesCount = existingCycles.stream()
                .filter(c -> !c.getId().equals(currentCycleId))
                .count();

        if (priorCyclesCount == 0) {
            Optional<UnitBookingTbl> bookingOpt =
                    unitBookingCrudService.findByStatusAndConvertedLeaseId(UnitBookingStatus.CONVERTED.name(), lease.getId());
            if (bookingOpt.isPresent()) {
                UnitBookingTbl booking = bookingOpt.get();
                RentCycleChargeTbl discountCharge = RentCycleChargeTbl.builder()
                        .rentCycle(cycle)
                        .chargeType(RentChargeType.DISCOUNT)
                        .amount(booking.getTokenAmount())
                        .description("Token amount adjustment from unit booking")
                        .build();
                chargesToSave.add(discountCharge);
                totalAmount = totalAmount.subtract(booking.getTokenAmount());
            }
        }

        if (!chargesToSave.isEmpty()) {
            rentCycleChargeCrudService.saveAll(chargesToSave);
        }

        cycle.setTotalAmount(totalAmount);
        RentCycleTbl savedCycle = rentCycleCrudService.save(cycle);

        BigDecimal delta = totalAmount.subtract(previousTotal);
        if (delta.compareTo(BigDecimal.ZERO) != 0) {
            FinanceLedgerTbl ledgerEntry = FinanceLedgerTbl.builder()
                .unitId(lease.getUnitId())
                .lease(lease)
                .transactionType(existingCycleOpt.isPresent() ? LedgerTransactionType.ADJUSTMENT : LedgerTransactionType.INVOICE_GENERATED)
                .amount(delta)
                .balance(delta)
                .referenceId(savedCycle.getId())
                .description("Invoice " + (existingCycleOpt.isPresent() ? "Regeneration" : "Generation") + " for " + billingMonthStr)
                .build();
            financeLedgerCrudService.save(ledgerEntry);
        }

        log.info("rent_cycle_generated rentCycleId={} leaseId={} billingMonth={} totalAmount={}",
                savedCycle.getId(), lease.getId(), savedCycle.getBillingMonth(), savedCycle.getTotalAmount());

        return savedCycle;
    }

    private RentChargeType mapCategoryToType(ChargeCategory category) {
        return switch (category) {
            case RENT -> RentChargeType.BASE_RENT;
            case ELECTRICITY -> RentChargeType.ELECTRICITY;
            case SERVICE -> RentChargeType.MAINTENANCE;
            case PENALTY -> RentChargeType.PENALTY;
            case DISCOUNT -> RentChargeType.DISCOUNT;
            default -> RentChargeType.CUSTOM;
        };
    }
}
