package com.livic.core.finance.service.impl;

import com.livic.platform.common.domain.CalculationStrategyType;
import com.livic.platform.common.domain.LeaseStatus;
import com.livic.platform.common.exception.BusinessException;
import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.core.finance.domain.LeaseTbl;
import com.livic.core.finance.domain.MeterReadingTbl;
import com.livic.core.finance.dto.MeterReadingDTOs.*;
import com.livic.core.finance.service.MeterReadingService;
import com.livic.core.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.core.finance.service.interfaces.LeaseCrudService;
import com.livic.core.finance.service.interfaces.LeaseQueryService;
import com.livic.core.finance.service.interfaces.MeterReadingCrudService;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.domain.UnitTbl;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.property.facade.UnitFacade;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MeterReadingServiceImpl implements MeterReadingService {

    private final MeterReadingCrudService meterReadingCrudService;
    private final LeaseQueryService leaseQueryService;
    private final ChargeConfigCrudService chargeConfigCrudService;
    private final PropertyFacade propertyFacade;
    private final UnitFacade unitFacade;
    private final UserFacade userFacade;

    @Override
    @Transactional
    public List<MeterReadingResponse> getOrCreateWorksheet(UUID propertyId, UUID chargeConfigId, Integer month, Integer year) {
        PropertySummaryDTO property = propertyFacade.getPropertyById(propertyId)
                .orElseThrow(() -> new BusinessException("Property not found"));
        ChargeConfigTbl chargeConfig = chargeConfigCrudService.findById(chargeConfigId)
                .orElseThrow(() -> new BusinessException("Charge config not found"));

        if (chargeConfig.getCalculationStrategy() != CalculationStrategyType.METERED) {
            throw new BusinessException("Charge config is not a metered strategy");
        }

        List<UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        List<LeaseTbl> activeLeases = leaseQueryService.findActiveLeasesByProperty(propertyId);
        Map<UUID, List<LeaseTbl>> unitToLeasesMap = activeLeases.stream()
                .collect(Collectors.groupingBy(LeaseTbl::getUnitId));

        List<MeterReadingTbl> existingEntries = meterReadingCrudService.findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(
                propertyId, chargeConfigId, month, year);
        Map<UUID, MeterReadingTbl> existingEntriesMap = existingEntries.stream()
                .collect(Collectors.toMap(MeterReadingTbl::getUnitId, r -> r));

        int previousMonth = month == 1 ? 12 : month - 1;
        int previousYear = month == 1 ? year - 1 : year;
        List<MeterReadingTbl> previousReadings = meterReadingCrudService.findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(
                propertyId, chargeConfigId, previousMonth, previousYear);
        Map<UUID, BigDecimal> previousReadingsMap = previousReadings.stream()
                .filter(r -> r.getCurrentReading() != null)
                .collect(Collectors.toMap(MeterReadingTbl::getUnitId, MeterReadingTbl::getCurrentReading));

        List<MeterReadingTbl> finalEntries = new ArrayList<>();
        List<MeterReadingTbl> newEntriesToSave = new ArrayList<>();

        for (UnitSummaryDTO unitSummary : units) {
            if (!unitToLeasesMap.containsKey(unitSummary.id())) {
                continue;
            }

            MeterReadingTbl entry = existingEntriesMap.get(unitSummary.id());
            if (entry == null) {
                BigDecimal previousReading = previousReadingsMap.get(unitSummary.id());
                if (previousReading == null) {
                    previousReading = BigDecimal.ZERO;
                }

                entry = MeterReadingTbl.builder()
                        .propertyId(property.id())
                        .unitId(unitSummary.id())
                        .chargeConfig(chargeConfig)
                        .billingMonth(month)
                        .billingYear(year)
                        .previousReading(previousReading)
                        .currentReading(null)
                        .isBilled(false)
                        .build();
                newEntriesToSave.add(entry);
            } else {
                finalEntries.add(entry);
            }
        }

        if (!newEntriesToSave.isEmpty()) {
            finalEntries.addAll(meterReadingCrudService.saveAll(newEntriesToSave));
        }

        Set<UUID> userIds = activeLeases.stream().map(LeaseTbl::getUserId).collect(Collectors.toSet());
        Map<UUID, UserSummaryDTO> usersMap = userFacade.getUsersByIds(userIds);

        Set<UUID> unitIdsInResult = finalEntries.stream().map(MeterReadingTbl::getUnitId).collect(Collectors.toSet());
        Map<UUID, UnitSummaryDTO> unitMap = units.stream()
                .filter(u -> unitIdsInResult.contains(u.id()))
                .collect(Collectors.toMap(UnitSummaryDTO::id, u -> u));

        return finalEntries.stream().map(r -> {
            List<LeaseTbl> leases = unitToLeasesMap.getOrDefault(r.getUnitId(), List.of());
            String tenantName = "Vacant";
            if (!leases.isEmpty()) {
                tenantName = leases.stream()
                        .map(l -> {
                            UserSummaryDTO user = usersMap.get(l.getUserId());
                            return user != null ? user.fullName() : "Unknown Tenant";
                        })
                        .collect(Collectors.joining(", "));
            }

            UnitSummaryDTO unit = unitMap.get(r.getUnitId());
            String unitName = unit != null ? unit.unitNumber() : "N/A";
            Integer floor = unit != null && unit.floor() != null ? unit.floor() : 0;

            return MeterReadingResponse.builder()
                    .id(r.getId())
                    .unitId(r.getUnitId())
                    .unitName(unitName)
                    .tenantName(tenantName)
                    .floor(floor)
                    .previousReading(r.getPreviousReading())
                    .currentReading(r.getCurrentReading())
                    .isBilled(r.getIsBilled())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void batchSaveReadings(MeterReadingRequest request) {
        List<MeterReadingTbl> existingEntries = meterReadingCrudService.findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(
                request.getPropertyId(), request.getChargeConfigId(), request.getBillingMonth(), request.getBillingYear());
        Map<UUID, MeterReadingTbl> existingEntriesMap = existingEntries.stream()
                .collect(Collectors.toMap(MeterReadingTbl::getUnitId, r -> r));

        List<MeterReadingTbl> toUpdate = new ArrayList<>();
        for (UnitReading entryReq : request.getReadings()) {
            MeterReadingTbl entry = existingEntriesMap.get(entryReq.getUnitId());
            if (entry != null && !Boolean.TRUE.equals(entry.getIsBilled())) {
                if (entryReq.getPreviousReading() != null) {
                    entry.setPreviousReading(entryReq.getPreviousReading());
                }
                entry.setCurrentReading(entryReq.getCurrentReading());
                toUpdate.add(entry);
            }
        }

        if (!toUpdate.isEmpty()) {
            meterReadingCrudService.saveAll(toUpdate);
        }
    }
}
