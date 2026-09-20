package com.livic.core.finance.facade.impl;

import com.livic.platform.common.domain.LeaseStatus;
import com.livic.core.finance.dto.ChargeConfigResponse;
import com.livic.verticals.rental.lease.dto.LeaseSummaryDTO;
import com.livic.core.finance.dto.UnitBookingDTOs;
import com.livic.core.finance.facade.FinanceFacade;
import com.livic.core.finance.mapper.UnitBookingMapper;
import com.livic.core.finance.service.ChargeConfigQueryService;
import com.livic.verticals.rental.lease.service.interfaces.LeaseCrudService;
import com.livic.verticals.rental.lease.service.interfaces.LeaseQueryService;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.service.interfaces.BillCrudService;
import com.livic.core.finance.service.interfaces.UnitBookingCrudService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class FinanceFacadeImpl implements FinanceFacade {

    private final BillCrudService billCrudService;
    private final ChargeConfigQueryService chargeConfigQueryService;
    private final UnitBookingCrudService unitBookingCrudService;
    private final com.livic.core.property.facade.UnitFacade unitFacade;
    private final com.livic.core.property.facade.UnitMemberFacade unitMemberFacade;

    public FinanceFacadeImpl(
            BillCrudService billCrudService,
            ChargeConfigQueryService chargeConfigQueryService,
            UnitBookingCrudService unitBookingCrudService,
            com.livic.core.property.facade.UnitFacade unitFacade,
            com.livic.core.property.facade.UnitMemberFacade unitMemberFacade) {
        this.billCrudService = billCrudService;
        this.chargeConfigQueryService = chargeConfigQueryService;
        this.unitBookingCrudService = unitBookingCrudService;
        this.unitFacade = unitFacade;
        this.unitMemberFacade = unitMemberFacade;
    }

    @Override
    public Optional<UUID> getPropertyIdByBillId(UUID billId) {
        // The bill carries its property, so authorisation no longer walks lease -> unit.
        return billCrudService.findById(billId).map(BillTbl::getPropertyId);
    }

    @Override
    public Optional<UUID> getLeaseIdByBillId(UUID billId) {
        return billCrudService.findById(billId)
                .flatMap(bill -> unitMemberFacade.getResidentByMemberId(bill.getMemberId()))
                .map(com.livic.core.property.dto.UnitResidentDTO::leaseId);
    }

    @Override
    public ChargeConfigResponse getChargeConfigById(UUID chargeConfigId) {
        return chargeConfigQueryService.getChargeConfigById(chargeConfigId);
    }

    @Override
    public RevenueMetricsDTO getRevenueMetrics(List<UUID> propertyIds, String billingMonth) {
        com.livic.core.finance.dto.RevenueMetricsDTO m = billCrudService.getRevenueMetrics(propertyIds, billingMonth);
        return new RevenueMetricsDTO(m.expected(), m.collected());
    }

    @Override
    public List<DefaulterRecordDTO> getDefaulters(List<UUID> propertyIds) {
        return getDefaulters(propertyIds, Pageable.unpaged()).getContent();
    }

    @Override
    public Page<DefaulterRecordDTO> getDefaulters(List<UUID> propertyIds, Pageable pageable) {
        Page<com.livic.core.finance.dto.DefaulterRecordDTO> page = billCrudService.getDefaulters(propertyIds, pageable);
        return page.map(d -> new DefaulterRecordDTO(d.tenantId(), d.unitNumber(), d.propertyName(), d.dueDate(), d.amountDue(), d.billId()));
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
        return UnitBookingMapper.toResponse(unitBookingCrudService.save(UnitBookingMapper.toEntity(request)), unitNumber);
    }
}
