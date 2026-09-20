package com.livic.verticals.rental.billing.service.impl;

import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.common.domain.LeaseStatus;
import com.livic.core.finance.domain.BillStatus;
import com.livic.platform.common.exception.BusinessException;
import com.livic.core.finance.domain.BillingWorksheetEntryTbl;
import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.dto.BillingWorksheetDTOs.*;
import com.livic.verticals.rental.billing.service.interfaces.BillingWorksheetService;
import com.livic.core.finance.service.interfaces.BillingWorksheetCrudService;
import com.livic.core.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.verticals.rental.lease.service.interfaces.LeaseCrudService;
import com.livic.verticals.rental.lease.service.interfaces.LeaseQueryService;
import com.livic.core.finance.service.interfaces.BillCrudService;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.domain.UnitTbl;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.UnitFacade;
import com.livic.platform.user.facade.UserFacade;
import com.livic.platform.user.dto.UserSummaryDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingWorksheetServiceImpl implements BillingWorksheetService {

    private final BillingWorksheetCrudService billingWorksheetCrudService;
    private final UnitFacade unitFacade;
    private final com.livic.core.property.facade.UnitMemberFacade unitMemberFacade;
    private final LeaseQueryService leaseQueryService;
    private final ChargeConfigCrudService chargeConfigCrudService;
    private final BillCrudService billCrudService;
    private final UserFacade userFacade;

    @Override
    @Transactional
    public List<WorksheetEntryResponse> getOrCreateWorksheetForMonth(UUID propertyId, UUID chargeConfigId, String billingMonth) {
        ChargeConfigTbl chargeConfig = chargeConfigCrudService.findById(chargeConfigId)
                .orElseThrow(() -> new BusinessException("Charge config not found"));

        List<UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        List<LeaseTbl> activeLeases = leaseQueryService.findActiveLeasesByProperty(propertyId);
        Map<UUID, List<LeaseTbl>> unitToLeasesMap = activeLeases.stream()
                .collect(Collectors.groupingBy(LeaseTbl::getUnitId));

        List<BillingWorksheetEntryTbl> existingEntries = billingWorksheetCrudService.findAllByPropertyIdAndChargeConfigIdAndBillingMonth(
                propertyId, chargeConfigId, billingMonth);
        Map<UUID, BillingWorksheetEntryTbl> existingEntriesMap = existingEntries.stream()
                .collect(Collectors.toMap(BillingWorksheetEntryTbl::getUnitId, r -> r));

        List<BillingWorksheetEntryTbl> finalEntries = new ArrayList<>();
        List<BillingWorksheetEntryTbl> toSave = new ArrayList<>();

        UUID authUserId = null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetailsImpl) {
            authUserId = UUID.fromString(((UserDetailsImpl) principal).getId());
        }

        Map<UUID, BigDecimal> carryForwardValues = new HashMap<>();
        if (Boolean.TRUE.equals(chargeConfig.getAutoCarryForward())) {
            List<Object[]> results = billingWorksheetCrudService.findLatestValuesForPropertyAndConfig(propertyId, chargeConfigId, billingMonth);
            for (Object[] row : results) {
                carryForwardValues.put((UUID) row[0], (BigDecimal) row[1]);
            }
        }

        for (UnitSummaryDTO unitSummary : units) {
            if (!unitToLeasesMap.containsKey(unitSummary.id())) {
                continue;
            }

            BillingWorksheetEntryTbl entry = existingEntriesMap.get(unitSummary.id());
            if (entry == null) {
                BigDecimal initialValue = BigDecimal.ZERO;
                if (chargeConfig.getChargeCategory() == com.livic.platform.common.domain.ChargeCategory.RENT) {
                    List<LeaseTbl> leasesForUnit = unitToLeasesMap.get(unitSummary.id());
                    if (leasesForUnit != null && !leasesForUnit.isEmpty() && leasesForUnit.get(0).getMonthlyRentAmount() != null) {
                        initialValue = leasesForUnit.get(0).getMonthlyRentAmount();
                    } else if (chargeConfig.getBaseRate() != null) {
                        initialValue = chargeConfig.getBaseRate();
                    }
                } else if (Boolean.TRUE.equals(chargeConfig.getAutoCarryForward())) {
                    initialValue = carryForwardValues.getOrDefault(unitSummary.id(), BigDecimal.ZERO);
                } else if (chargeConfig.getBaseRate() != null) {
                    initialValue = chargeConfig.getBaseRate();
                }

                entry = BillingWorksheetEntryTbl.builder()
                        .propertyId(propertyId)
                        .unitId(unitSummary.id())
                        .chargeConfig(chargeConfig)
                        .billingMonth(billingMonth)
                        .enteredValue(initialValue)
                        .createdBy(authUserId != null ? authUserId : UUID.randomUUID())
                        .build();
                toSave.add(entry);
            }
            finalEntries.add(entry);
        }

        if (!toSave.isEmpty()) {
            billingWorksheetCrudService.saveAll(toSave);
        }

        List<UUID> tenantUserIds = activeLeases.stream()
                .map(LeaseTbl::getUserId)
                .distinct()
                .collect(Collectors.toList());
        Map<UUID, UserSummaryDTO> userMap = tenantUserIds.isEmpty() ? Collections.emptyMap() :
                userFacade.getUsersByIds(tenantUserIds);

        List<BillTbl> existingCycles = billCrudService.findByPropertyIdAndBillingMonth(propertyId, billingMonth);
        Set<UUID> billedMemberIds = existingCycles.stream()
                .map(BillTbl::getMemberId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());
        Set<UUID> billedLeaseIds = unitMemberFacade.getResidentsByMemberIds(billedMemberIds).stream()
                .map(com.livic.core.property.dto.UnitResidentDTO::leaseId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, UnitSummaryDTO> unitSummaryMap = units.stream()
                .collect(Collectors.toMap(UnitSummaryDTO::id, u -> u));

        return finalEntries.stream()
                .map(entry -> {
                    UUID unitId = entry.getUnitId();
                    UnitSummaryDTO unitSummary = unitSummaryMap.get(unitId);
                    List<LeaseTbl> leases = unitToLeasesMap.get(unitId);

                    String tenantNames = "";
                    boolean isBilled = false;
                    if (leases != null) {
                        tenantNames = leases.stream()
                                .map(l -> userMap.get(l.getUserId()))
                                .filter(Objects::nonNull)
                                .map(UserSummaryDTO::fullName)
                                .collect(Collectors.joining(", "));
                        isBilled = leases.stream().anyMatch(l -> billedLeaseIds.contains(l.getId()));
                    }

                    return WorksheetEntryResponse.builder()
                            .id(entry.getId())
                            .unitId(unitId)
                            .unitName(unitSummary != null ? unitSummary.unitNumber() : "N/A")
                            .tenantName(tenantNames)
                            .floor((unitSummary != null && unitSummary.floor() != null) ? unitSummary.floor() : 0)
                            .enteredValue(entry.getEnteredValue())
                            .isBilled(isBilled)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void saveWorksheet(WorksheetSaveRequest request) {
        List<BillTbl> bills = billCrudService.findByPropertyIdAndBillingMonth(
                request.getPropertyId(), request.getBillingMonth());

        boolean isLocked = bills.stream().anyMatch(rc ->
                rc.getStatus() == BillStatus.PUBLISHED ||
                        rc.getStatus() == BillStatus.PAID ||
                        rc.getStatus() == BillStatus.PARTIALLY_PAID
        );

        if (isLocked) {
            throw new BusinessException("Cannot update worksheet entries because rent bills for this month have already been published or paid");
        }

        List<BillingWorksheetEntryTbl> existing = billingWorksheetCrudService.findAllByPropertyIdAndChargeConfigIdAndBillingMonth(
                request.getPropertyId(), request.getChargeConfigId(), request.getBillingMonth());
        Map<UUID, BillingWorksheetEntryTbl> entryMap = existing.stream()
                .collect(Collectors.toMap(BillingWorksheetEntryTbl::getUnitId, e -> e));

        List<BillingWorksheetEntryTbl> toUpdate = new ArrayList<>();
        for (UnitEntry item : request.getEntries()) {
            BillingWorksheetEntryTbl entry = entryMap.get(item.getUnitId());
            if (entry != null) {
                entry.setEnteredValue(item.getEnteredValue());
                toUpdate.add(entry);
            }
        }

        if (!toUpdate.isEmpty()) {
            billingWorksheetCrudService.saveAll(toUpdate);
        }
    }
}
