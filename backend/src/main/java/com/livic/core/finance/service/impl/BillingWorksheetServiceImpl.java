package com.livic.core.finance.service.impl;

import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.domain.BillingWorksheetEntryTbl;
import com.livic.core.finance.domain.CalculationStrategyType;
import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.core.finance.dto.BillingWorksheetDTOs.UnitEntry;
import com.livic.core.finance.dto.BillingWorksheetDTOs.WorksheetEntryResponse;
import com.livic.core.finance.dto.BillingWorksheetDTOs.WorksheetSaveRequest;
import com.livic.core.finance.repository.BillRepository;
import com.livic.core.finance.repository.BillingWorksheetRepository;
import com.livic.core.finance.repository.ChargeConfigRepository;
import com.livic.core.finance.service.interfaces.BillingWorksheetService;
import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.UnitFacade;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillingWorksheetServiceImpl implements BillingWorksheetService {

    /** Family members live in a unit but do not pay for it. */
    private static final Set<UnitMemberRole> PAYER_ROLES = Set.of(UnitMemberRole.TENANT, UnitMemberRole.OWNER);

    private final BillingWorksheetRepository billingWorksheetRepository;
    private final ChargeConfigRepository chargeConfigRepository;
    private final BillRepository billRepository;
    private final UnitFacade unitFacade;
    private final UnitMemberFacade unitMemberFacade;
    private final UserFacade userFacade;

    @Override
    @Transactional
    public List<WorksheetEntryResponse> getOrCreateWorksheetForMonth(UUID propertyId, UUID chargeConfigId, String billingMonth, UUID actingUserId) {
        ChargeConfigTbl chargeConfig = chargeConfigRepository.findById(chargeConfigId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Charge config not found"));

        Map<UUID, List<UnitResidentDTO>> payersByUnitId = payersByUnitId(propertyId);
        List<BillingWorksheetEntryTbl> entries = ensureEntries(propertyId, chargeConfig, billingMonth, payersByUnitId.keySet(), actingUserId);

        Map<UUID, UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId).stream()
                .collect(Collectors.toMap(UnitSummaryDTO::id, Function.identity(), (a, b) -> a));
        Map<UUID, UserSummaryDTO> users = userFacade.getUsersByIds(payersByUnitId.values().stream()
                .flatMap(List::stream)
                .map(UnitResidentDTO::userId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet()));
        Set<UUID> billedMemberIds = billRepository.findByPropertyIdAndBillingMonth(propertyId, billingMonth).stream()
                .map(BillTbl::getMemberId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        return entries.stream()
                .map(entry -> {
                    UnitSummaryDTO unit = units.get(entry.getUnitId());
                    List<UnitResidentDTO> payers = payersByUnitId.getOrDefault(entry.getUnitId(), List.of());
                    return WorksheetEntryResponse.builder()
                            .id(entry.getId())
                            .unitId(entry.getUnitId())
                            .unitName(unit != null ? unit.unitNumber() : "N/A")
                            .blockId(unit != null ? unit.blockId() : null)
                            .blockName(unit != null ? unit.blockName() : null)
                            .payerName(payers.stream()
                                    .map(p -> users.get(p.userId()))
                                    .filter(Objects::nonNull)
                                    .map(UserSummaryDTO::fullName)
                                    .collect(Collectors.joining(", ")))
                            .floor(unit != null && unit.floor() != null ? unit.floor() : 0)
                            .enteredValue(entry.getEnteredValue())
                            .billed(payers.stream().anyMatch(p -> billedMemberIds.contains(p.memberId())))
                            .build();
                })
                .toList();
    }

    @Override
    @Transactional
    public void saveWorksheet(WorksheetSaveRequest request) {
        boolean locked = billRepository.findByPropertyIdAndBillingMonth(request.getPropertyId(), request.getBillingMonth()).stream()
                .anyMatch(bill -> bill.getStatus() == BillStatus.PUBLISHED
                        || bill.getStatus() == BillStatus.PAID
                        || bill.getStatus() == BillStatus.PARTIALLY_PAID);
        if (locked) {
            throw new BusinessException("Cannot update worksheet entries because bills for this month have already been published or paid");
        }

        Map<UUID, BillingWorksheetEntryTbl> entriesByUnitId = billingWorksheetRepository
                .findAllByPropertyIdAndChargeConfigIdAndBillingMonth(request.getPropertyId(), request.getChargeConfigId(), request.getBillingMonth())
                .stream()
                .collect(Collectors.toMap(BillingWorksheetEntryTbl::getUnitId, Function.identity()));

        List<BillingWorksheetEntryTbl> toUpdate = new ArrayList<>();
        for (UnitEntry item : request.getEntries()) {
            BillingWorksheetEntryTbl entry = entriesByUnitId.get(item.getUnitId());
            if (entry != null) {
                entry.setEnteredValue(item.getEnteredValue());
                toUpdate.add(entry);
            }
        }
        if (!toUpdate.isEmpty()) {
            billingWorksheetRepository.saveAll(toUpdate);
        }
    }

    @Override
    @Transactional
    public void prepareMonth(UUID propertyId, String billingMonth, UUID actingUserId) {
        Set<UUID> payingUnitIds = payersByUnitId(propertyId).keySet();
        for (ChargeConfigTbl config : chargeConfigRepository.findAllByPropertyIdAndIsActiveTrue(propertyId)) {
            if (config.getCalculationStrategy() == CalculationStrategyType.FIXED_RATE) {
                ensureEntries(propertyId, config, billingMonth, payingUnitIds, actingUserId);
            }
        }
    }

    /** The month's entries for one charge, creating the missing ones for units that have a payer. */
    private List<BillingWorksheetEntryTbl> ensureEntries(UUID propertyId, ChargeConfigTbl config, String billingMonth,
                                                         Collection<UUID> payingUnitIds, UUID actingUserId) {
        Map<UUID, BillingWorksheetEntryTbl> existing = billingWorksheetRepository
                .findAllByPropertyIdAndChargeConfigIdAndBillingMonth(propertyId, config.getId(), billingMonth)
                .stream()
                .collect(Collectors.toMap(BillingWorksheetEntryTbl::getUnitId, Function.identity()));

        Map<UUID, BigDecimal> carriedForward = new HashMap<>();
        if (Boolean.TRUE.equals(config.getAutoCarryForward())) {
            for (Object[] row : billingWorksheetRepository.findLatestValuesForPropertyAndConfig(propertyId, config.getId(), billingMonth)) {
                carriedForward.put((UUID) row[0], (BigDecimal) row[1]);
            }
        }

        List<BillingWorksheetEntryTbl> entries = new ArrayList<>();
        List<BillingWorksheetEntryTbl> created = new ArrayList<>();
        for (UUID unitId : payingUnitIds) {
            BillingWorksheetEntryTbl entry = existing.get(unitId);
            if (entry == null) {
                BigDecimal initialValue = Boolean.TRUE.equals(config.getAutoCarryForward())
                        ? carriedForward.getOrDefault(unitId, BigDecimal.ZERO)
                        : config.getBaseRate() != null ? config.getBaseRate() : BigDecimal.ZERO;
                entry = BillingWorksheetEntryTbl.builder()
                        .propertyId(propertyId)
                        .unitId(unitId)
                        .chargeConfig(config)
                        .billingMonth(billingMonth)
                        .enteredValue(initialValue)
                        .createdBy(actingUserId)
                        .build();
                created.add(entry);
            }
            entries.add(entry);
        }
        if (!created.isEmpty()) {
            billingWorksheetRepository.saveAll(created);
        }
        return entries;
    }

    private Map<UUID, List<UnitResidentDTO>> payersByUnitId(UUID propertyId) {
        return unitMemberFacade.getActiveResidentsByPropertyId(propertyId).stream()
                .filter(resident -> PAYER_ROLES.contains(resident.role()))
                .collect(Collectors.groupingBy(UnitResidentDTO::unitId));
    }
}
