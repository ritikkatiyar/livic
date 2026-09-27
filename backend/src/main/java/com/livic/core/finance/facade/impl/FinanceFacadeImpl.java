package com.livic.core.finance.facade.impl;

import com.livic.core.finance.repository.UnitBookingRepository;
import com.livic.core.finance.repository.BillRepository;
import com.livic.core.finance.dto.ChargeConfigResponse;
import com.livic.core.finance.dto.UnitBookingDTOs;
import com.livic.core.finance.facade.FinanceFacade;
import com.livic.core.finance.mapper.UnitBookingMapper;
import com.livic.core.finance.service.interfaces.ChargeConfigQueryService;
import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.dto.UnitSummaryDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class FinanceFacadeImpl implements FinanceFacade {

    private final BillRepository billRepository;
    private final ChargeConfigQueryService chargeConfigQueryService;
    private final UnitBookingRepository unitBookingRepository;
    private final com.livic.core.property.facade.UnitFacade unitFacade;
    private final com.livic.core.property.facade.UnitMemberFacade unitMemberFacade;

    public FinanceFacadeImpl(
            BillRepository billRepository,
            ChargeConfigQueryService chargeConfigQueryService,
            UnitBookingRepository unitBookingRepository,
            com.livic.core.property.facade.UnitFacade unitFacade,
            com.livic.core.property.facade.UnitMemberFacade unitMemberFacade) {
        this.billRepository = billRepository;
        this.chargeConfigQueryService = chargeConfigQueryService;
        this.unitBookingRepository = unitBookingRepository;
        this.unitFacade = unitFacade;
        this.unitMemberFacade = unitMemberFacade;
    }


    @Override
    public Optional<UUID> getLeaseIdByBillId(UUID billId) {
        return billRepository.findById(billId)
                .flatMap(bill -> unitMemberFacade.getResidentByMemberId(bill.getMemberId()))
                .map(com.livic.core.property.dto.UnitResidentDTO::leaseId);
    }

    @Override
    public ChargeConfigResponse getChargeConfigById(UUID chargeConfigId) {
        return chargeConfigQueryService.getChargeConfigById(chargeConfigId);
    }

    @Override
    public RevenueMetricsDTO getRevenueMetrics(List<UUID> propertyIds, String billingMonth) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return new RevenueMetricsDTO(BigDecimal.ZERO, BigDecimal.ZERO);
        }
        com.livic.core.finance.dto.RevenueMetricsDTO m = billRepository.calculateRevenueMetrics(propertyIds, billingMonth, BillStatus.PAID);
        return m != null ? new RevenueMetricsDTO(m.expected(), m.collected()) : new RevenueMetricsDTO(BigDecimal.ZERO, BigDecimal.ZERO);
    }

    /**
     * Bills are reached through the property id carried on the bill, not by first resolving a
     * property to its active leases. That older path both excluded owners, who have no lease at
     * all, and quietly dropped the unpaid bills of tenancies that had already ended.
     */
    @Override
    public Page<DefaulterRecordDTO> getDefaulters(List<UUID> propertyIds, Pageable pageable) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return Page.empty(pageable);
        }
        Page<BillTbl> defaulters = billRepository.findDefaulterBills(
                propertyIds,
                BillStatus.OVERDUE,
                BillStatus.PENDING,
                LocalDate.now(),
                pageable
        );

        Set<UUID> memberIds = defaulters.getContent().stream()
                .map(BillTbl::getMemberId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, UnitResidentDTO> membersById = unitMemberFacade.getResidentsByMemberIds(memberIds).stream()
                .collect(Collectors.toMap(UnitResidentDTO::memberId, Function.identity(), (a, b) -> a));

        Set<UUID> unitIds = membersById.values().stream()
                .map(UnitResidentDTO::unitId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, UnitSummaryDTO> unitsMap = unitIds.isEmpty() ? Map.of() : unitFacade.getUnitsByIds(unitIds);

        return defaulters.map(bill -> {
            UnitResidentDTO payer = membersById.get(bill.getMemberId());
            UnitSummaryDTO unitSummary = payer != null && payer.unitId() != null ? unitsMap.get(payer.unitId()) : null;
            String unitNumber = unitSummary != null ? unitSummary.unitNumber() : "Vacant";
            String propertyName = unitSummary != null ? unitSummary.propertyName() : "N/A";
            return new DefaulterRecordDTO(
                    payer != null ? payer.userId() : null,
                    unitNumber,
                    propertyName,
                    unitSummary != null ? unitSummary.blockId() : null,
                    unitSummary != null ? unitSummary.blockName() : null,
                    bill.getDueDate(),
                    bill.getTotalAmount(),
                    bill.getId()
            );
        });
    }

    @Override
    public BigDecimal getTotalExpenses(List<UUID> propertyIds) {
        return BigDecimal.ZERO;
    }

    @Override
    public Map<String, BigDecimal> getOperationalOverhead(List<UUID> propertyIds) {
        return Collections.emptyMap();
    }

    @Override
    @Transactional
    public UnitBookingDTOs.UnitBookingResponse createPaidBooking(UnitBookingDTOs.PaidBookingRequest request) {
        String unitNumber = unitFacade.getUnitById(request.unitId())
                .map(com.livic.core.property.dto.UnitSummaryDTO::unitNumber)
                .orElse(null);
        return UnitBookingMapper.toResponse(unitBookingRepository.save(UnitBookingMapper.toEntity(request)), unitNumber);
    }
}
