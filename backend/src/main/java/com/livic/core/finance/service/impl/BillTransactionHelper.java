package com.livic.core.finance.service.impl;

import com.livic.platform.common.domain.CalculationStrategyType;
import com.livic.platform.common.domain.ChargeCategory;
import com.livic.platform.common.domain.LedgerTransactionType;
import com.livic.platform.common.domain.LeaseStatus;
import com.livic.platform.common.domain.RentChargeType;
import com.livic.platform.common.domain.UnitBookingStatus;
import com.livic.platform.common.exception.BusinessException;
import com.livic.core.finance.domain.BillingWorksheetEntryTbl;
import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.core.finance.domain.FinanceLedgerTbl;
import com.livic.core.finance.domain.LeaseTbl;
import com.livic.core.finance.domain.BillLineTbl;
import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.domain.BillType;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.core.finance.domain.UnitBookingTbl;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.core.finance.service.interfaces.BillingWorksheetCrudService;
import com.livic.core.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.core.finance.service.interfaces.FinanceLedgerCrudService;
import com.livic.core.finance.service.interfaces.LeaseCrudService;
import com.livic.core.finance.service.interfaces.BillLineCrudService;
import com.livic.core.finance.service.interfaces.BillCrudService;
import com.livic.core.finance.service.interfaces.BillService;
import com.livic.core.finance.service.interfaces.UnitBookingCrudService;
import com.livic.core.finance.strategy.CalculationResult;
import com.livic.core.finance.strategy.ChargeCalculationService;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.UnitFacade;
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
public class BillTransactionHelper {

    private final BillCrudService billCrudService;
    private final BillLineCrudService billLineCrudService;
    private final UnitFacade unitFacade;
    private final UnitMemberFacade unitMemberFacade;
    private final BillingWorksheetCrudService billingWorksheetCrudService;
    private final LeaseCrudService leaseCrudService;
    private final ChargeConfigCrudService chargeConfigCrudService;
    private final ChargeCalculationService chargeCalculationService;
    private final UnitBookingCrudService unitBookingCrudService;
    private final FinanceLedgerCrudService financeLedgerCrudService;
    private final BillService billService;

    public BillTransactionHelper(
            BillCrudService billCrudService,
            BillLineCrudService billLineCrudService,
            UnitFacade unitFacade,
            UnitMemberFacade unitMemberFacade,
            BillingWorksheetCrudService billingWorksheetCrudService,
            LeaseCrudService leaseCrudService,
            ChargeConfigCrudService chargeConfigCrudService,
            ChargeCalculationService chargeCalculationService,
            UnitBookingCrudService unitBookingCrudService,
            FinanceLedgerCrudService financeLedgerCrudService,
            @Lazy BillService billService
    ) {
        this.billCrudService = billCrudService;
        this.billLineCrudService = billLineCrudService;
        this.unitFacade = unitFacade;
        this.unitMemberFacade = unitMemberFacade;
        this.billingWorksheetCrudService = billingWorksheetCrudService;
        this.leaseCrudService = leaseCrudService;
        this.chargeConfigCrudService = chargeConfigCrudService;
        this.chargeCalculationService = chargeCalculationService;
        this.unitBookingCrudService = unitBookingCrudService;
        this.financeLedgerCrudService = financeLedgerCrudService;
        this.billService = billService;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public BillTbl generateSingleInTransaction(LeaseTbl lease, String billingMonthStr, LocalDate dueDate, Map<UUID, Integer> roommateCounts) {
        return processLeaseGeneration(lease, billingMonthStr, dueDate, roommateCounts, null, null, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public BillTbl generateSingleInTransaction(
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
    public BillDTOs.BillResponse publishSingleInTransaction(UUID id) {
        return billService.publish(id);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public BillDTOs.BillResponse unpublishSingleInTransaction(UUID id) {
        return billService.unpublish(id);
    }

    public BillTbl processLeaseGeneration(LeaseTbl lease, String billingMonthStr, LocalDate dueDate, Map<UUID, Integer> roommateCounts) {
        return processLeaseGeneration(lease, billingMonthStr, dueDate, roommateCounts, null, null, null);
    }

    public BillTbl processLeaseGeneration(
            LeaseTbl lease,
            String billingMonthStr,
            LocalDate dueDate,
            Map<UUID, Integer> roommateCounts,
            List<BillingWorksheetEntryTbl> propertyWorksheets,
            List<ChargeConfigTbl> propertyActiveConfigs,
            Map<UUID, String> unitNumbers
    ) {
        UnitResidentDTO payer = unitMemberFacade.getResidentByLeaseId(lease.getId())
                .orElseThrow(() -> new BusinessException(HttpStatus.CONFLICT,
                        "Lease " + lease.getId() + " has no active unit member to bill"));
        Optional<BillTbl> existingCycleOpt = billCrudService.findByMemberIdAndBillingMonth(
                payer.memberId(), billingMonthStr, BillType.RENT);
        BillTbl cycle;
        BigDecimal previousTotal = BigDecimal.ZERO;

        if (existingCycleOpt.isPresent()) {
            cycle = existingCycleOpt.get();
            if (cycle.getStatus() == BillStatus.PAID) {
                String unitNum = (unitNumbers != null && unitNumbers.containsKey(lease.getUnitId()))
                        ? unitNumbers.get(lease.getUnitId())
                        : unitFacade.getUnitById(lease.getUnitId()).map(UnitSummaryDTO::unitNumber).orElse("N/A");
                throw new BusinessException(HttpStatus.CONFLICT, "Cannot regenerate a paid rent cycle for unit " + unitNum);
            }
            previousTotal = cycle.getTotalAmount();
            List<BillLineTbl> existingCharges = billLineCrudService.findByBill_Id(cycle.getId());
            billLineCrudService.deleteAll(existingCharges);
        } else {
            cycle = BillTbl.builder()
                    .propertyId(payer.propertyId())
                    .memberId(payer.memberId())
                    .billType(BillType.RENT)
                    .billingMonth(billingMonthStr)
                    .dueDate(dueDate)
                    .totalAmount(BigDecimal.ZERO)
                    .status(BillStatus.PENDING)
                    .build();
            cycle = billCrudService.save(cycle);
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<BillLineTbl> chargesToSave = new ArrayList<>();

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
            BillLineTbl rentCharge = BillLineTbl.builder()
                    .bill(cycle)
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

            BillLineTbl charge = BillLineTbl.builder()
                    .bill(cycle)
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

        List<BillTbl> existingCycles = billCrudService.findByMemberId(payer.memberId());
        final UUID curbillId = cycle.getId();
        long priorCyclesCount = existingCycles.stream()
                .filter(c -> !c.getId().equals(curbillId))
                .count();

        if (priorCyclesCount == 0) {
            Optional<UnitBookingTbl> bookingOpt =
                    unitBookingCrudService.findByStatusAndConvertedLeaseId(UnitBookingStatus.CONVERTED.name(), lease.getId());
            if (bookingOpt.isPresent()) {
                UnitBookingTbl booking = bookingOpt.get();
                BillLineTbl discountCharge = BillLineTbl.builder()
                        .bill(cycle)
                        .chargeType(RentChargeType.DISCOUNT)
                        .amount(booking.getTokenAmount())
                        .description("Token amount adjustment from unit booking")
                        .build();
                chargesToSave.add(discountCharge);
                totalAmount = totalAmount.subtract(booking.getTokenAmount());
            }
        }

        if (!chargesToSave.isEmpty()) {
            billLineCrudService.saveAll(chargesToSave);
        }

        cycle.setTotalAmount(totalAmount);
        BillTbl savedCycle = billCrudService.save(cycle);

        BigDecimal delta = totalAmount.subtract(previousTotal);
        if (delta.compareTo(BigDecimal.ZERO) != 0) {
            FinanceLedgerTbl ledgerEntry = FinanceLedgerTbl.builder()
                .unitId(payer.unitId())
                .memberId(payer.memberId())
                .leaseId(lease.getId())
                .transactionType(existingCycleOpt.isPresent() ? LedgerTransactionType.ADJUSTMENT : LedgerTransactionType.INVOICE_GENERATED)
                .amount(delta)
                .balance(delta)
                .referenceId(savedCycle.getId())
                .description("Invoice " + (existingCycleOpt.isPresent() ? "Regeneration" : "Generation") + " for " + billingMonthStr)
                .build();
            financeLedgerCrudService.save(ledgerEntry);
        }

        log.info("rent_cycle_generated billId={} leaseId={} billingMonth={} totalAmount={}",
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
