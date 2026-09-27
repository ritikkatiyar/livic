package com.livic.verticals.rental.billing.service.impl;

import com.livic.core.finance.repository.MeterReadingRepository;
import com.livic.core.finance.repository.BillingWorksheetRepository;
import com.livic.core.finance.repository.ChargeConfigRepository;
import com.livic.core.finance.domain.BillingWorksheetEntryTbl;
import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.domain.MeterReadingTbl;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.core.finance.service.interfaces.BillService;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.UnitFacade;
import com.livic.core.finance.domain.CalculationStrategyType;
import com.livic.verticals.rental.billing.service.interfaces.RentGenerationService;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.verticals.rental.lease.service.interfaces.LeaseQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RentGenerationServiceImpl implements RentGenerationService {

    private final LeaseQueryService leaseQueryService;
    private final ChargeConfigRepository chargeConfigRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final UnitFacade unitFacade;
    private final BillingWorksheetRepository billingWorksheetRepository;
    private final BillTransactionHelper transactionHelper;
    private final BillService billService;

    @Override
    @Transactional
    public BillDTOs.BillResponse generate(BillDTOs.GenerateBillRequest request) {
        LeaseTbl lease = leaseQueryService.getLeaseById(request.leaseId());
        BillTbl cycle = transactionHelper.generateSingleInTransaction(lease, request.billingMonth(), request.dueDate(), null);
        return billService.getById(cycle.getId());
    }

    @Override
    public BillDTOs.BatchGenerateResult batchGenerate(BillDTOs.BatchGenerateBillRequest request) {
        List<UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(request.propertyId());
        Map<UUID, String> unitNumbers = units.stream().collect(Collectors.toMap(UnitSummaryDTO::id, UnitSummaryDTO::unitNumber, (a, b) -> a));
        List<LeaseTbl> activeLeases = leaseQueryService.findActiveLeasesByProperty(request.propertyId());

        Map<UUID, Integer> roommateCounts = activeLeases.stream()
                .collect(Collectors.groupingBy(LeaseTbl::getUnitId, Collectors.collectingAndThen(Collectors.toList(), List::size)));

        List<BillingWorksheetEntryTbl> propertyWorksheets = billingWorksheetRepository.findAllByPropertyIdAndBillingMonth(request.propertyId(), request.billingMonth());
        List<ChargeConfigTbl> propertyActiveConfigs = chargeConfigRepository.findAllByPropertyIdAndIsActiveTrue(request.propertyId());

        List<BillTbl> successes = new ArrayList<>();
        List<BillDTOs.BatchGenerateFailure> failures = new ArrayList<>();

        for (LeaseTbl lease : activeLeases) {
            String unitNum = unitNumbers.get(lease.getUnitId());
            try {
                BillTbl cycle = transactionHelper.generateSingleInTransaction(
                        lease,
                        request.billingMonth(),
                        request.dueDate(),
                        roommateCounts,
                        propertyWorksheets,
                        propertyActiveConfigs,
                        unitNumbers
                );
                successes.add(cycle);
            } catch (Exception e) {
                log.error("[BillServiceImpl] Failed to generate bill for lease ID: {}, unit: {}", lease.getId(), unitNum, e);
                failures.add(new BillDTOs.BatchGenerateFailure(lease.getId(), unitNum, e.getMessage()));
            }
        }

        List<BillDTOs.BillResponse> succeededResponses = new ArrayList<>(billService.toResponses(successes));
        succeededResponses.sort(Comparator.comparing(BillDTOs.BillResponse::unitNumber)
                .thenComparing(BillDTOs.BillResponse::tenantName));
        return new BillDTOs.BatchGenerateResult(succeededResponses, failures);
    }

    @Override
    @Transactional(readOnly = true)
    public BillDTOs.PreFlightChecklistResponse getPreFlightChecklist(UUID propertyId, String billingMonth) {
        List<UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        List<LeaseTbl> activeLeases = leaseQueryService.findActiveLeasesByProperty(propertyId);
        int totalUnits = units.size();
        int activeLeasesCount = activeLeases.size();

        long meteredTypesCount = chargeConfigRepository.findAllByPropertyIdAndIsActiveTrue(propertyId).stream()
                .filter(c -> c.getCalculationStrategy() == CalculationStrategyType.METERED)
                .count();

        int meterReadingsExpected = activeLeasesCount * (int) meteredTypesCount;
        int meterReadingsEntered = 0;

        try {
            String[] parts = billingMonth.split("-");
            int year = Integer.parseInt(parts[0]);
            int month = Integer.parseInt(parts[1]);

            List<MeterReadingTbl> propertyReadings = meterReadingRepository.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, month, year);
            Map<UUID, List<MeterReadingTbl>> readingsByUnit = propertyReadings.stream()
                    .collect(Collectors.groupingBy(MeterReadingTbl::getUnitId));

            for (LeaseTbl lease : activeLeases) {
                List<MeterReadingTbl> readings = readingsByUnit.getOrDefault(lease.getUnitId(), List.of());
                long enteredForLease = readings.stream().filter(r -> r.getCurrentReading() != null).count();
                meterReadingsEntered += enteredForLease;
            }
        } catch (Exception e) {
            log.warn("Failed to calculate meter readings for checklist", e);
        }

        boolean isReady = (meterReadingsEntered >= meterReadingsExpected) || activeLeasesCount == 0;
        return new BillDTOs.PreFlightChecklistResponse(
            totalUnits,
            activeLeasesCount,
            meterReadingsExpected,
            meterReadingsEntered,
            isReady
        );
    }

}
