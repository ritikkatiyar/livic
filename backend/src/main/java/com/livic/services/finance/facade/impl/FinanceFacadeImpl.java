package com.livic.services.finance.facade.impl;

import com.livic.platform.common.domain.LeaseStatus;
import com.livic.services.finance.dto.ChargeConfigResponse;
import com.livic.services.finance.dto.LeaseSummaryDTO;
import com.livic.services.finance.dto.UnitBookingDTOs;
import com.livic.services.finance.facade.FinanceFacade;
import com.livic.services.finance.mapper.UnitBookingMapper;
import com.livic.services.finance.service.ChargeConfigQueryService;
import com.livic.services.finance.service.interfaces.LeaseCrudService;
import com.livic.services.finance.service.interfaces.LeaseQueryService;
import com.livic.services.finance.service.interfaces.RentCycleCrudService;
import com.livic.services.finance.service.interfaces.UnitBookingCrudService;
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

    private final LeaseQueryService leaseQueryService;
    private final LeaseCrudService leaseCrudService;
    private final RentCycleCrudService rentCycleCrudService;
    private final ChargeConfigQueryService chargeConfigQueryService;
    private final UnitBookingCrudService unitBookingCrudService;
    private final com.livic.services.property.facade.UnitFacade unitFacade;

    public FinanceFacadeImpl(
            LeaseQueryService leaseQueryService,
            LeaseCrudService leaseCrudService,
            RentCycleCrudService rentCycleCrudService,
            ChargeConfigQueryService chargeConfigQueryService,
            UnitBookingCrudService unitBookingCrudService,
            com.livic.services.property.facade.UnitFacade unitFacade) {
        this.leaseQueryService = leaseQueryService;
        this.leaseCrudService = leaseCrudService;
        this.rentCycleCrudService = rentCycleCrudService;
        this.chargeConfigQueryService = chargeConfigQueryService;
        this.unitBookingCrudService = unitBookingCrudService;
        this.unitFacade = unitFacade;
    }

    @Override
    public boolean isUnitOccupiedOnDate(UUID unitId, LocalDate date) {
        return leaseCrudService.existsActiveLeaseOnDate(unitId, LeaseStatus.ACTIVE, date);
    }

    @Override
    public Optional<LeaseSummaryDTO> getActiveLeaseForUser(UUID userId) {
        return leaseQueryService.findByUserIdAndStatus(userId, LeaseStatus.ACTIVE)
                .map(lease -> {
                    com.livic.services.property.dto.UnitSummaryDTO u = unitFacade.getUnitById(lease.getUnitId()).orElse(null);
                    return LeaseSummaryDTO.from(lease, u);
                });
    }

    @Override
    public List<LeaseSummaryDTO> getActiveLeasesByPropertyId(UUID propertyId) {
        List<com.livic.services.property.dto.UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        Map<UUID, com.livic.services.property.dto.UnitSummaryDTO> unitMap = units.stream()
                .collect(java.util.stream.Collectors.toMap(com.livic.services.property.dto.UnitSummaryDTO::id, u -> u));
        return leaseQueryService.findActiveLeasesByProperty(propertyId).stream()
                .map(lease -> LeaseSummaryDTO.from(lease, unitMap.get(lease.getUnitId())))
                .toList();
    }

    @Override
    public List<LeaseSummaryDTO> getActiveLeasesByUnitId(UUID unitId) {
        com.livic.services.property.dto.UnitSummaryDTO u = unitFacade.getUnitById(unitId).orElse(null);
        return leaseQueryService.findByUnitIdAndStatus(unitId, LeaseStatus.ACTIVE).stream()
                .map(lease -> LeaseSummaryDTO.from(lease, u))
                .toList();
    }

    @Override
    public Map<UUID, List<LeaseSummaryDTO>> getActiveLeasesByUnitIds(Collection<UUID> unitIds) {
        if (unitIds == null || unitIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return leaseQueryService.findActiveLeasesByUnitIds(unitIds);
    }

    @Override
    public boolean hasLeasesForProperty(UUID propertyId) {
        return leaseQueryService.existsByPropertyId(propertyId);
    }

    @Override
    public boolean hasLeasesForUnit(UUID unitId) {
        return leaseQueryService.existsByUnitId(unitId);
    }

    @Override
    public Optional<LeaseSummaryDTO> getLeaseById(UUID leaseId) {
        return leaseCrudService.findById(leaseId)
                .map(lease -> {
                    com.livic.services.property.dto.UnitSummaryDTO u = unitFacade.getUnitById(lease.getUnitId()).orElse(null);
                    return LeaseSummaryDTO.from(lease, u);
                });
    }

    @Override
    public Optional<UUID> getPropertyIdByRentCycleId(UUID rentCycleId) {
        return rentCycleCrudService.findById(rentCycleId)
                .map(r -> {
                    if (r.getLease() == null) return null;
                    com.livic.services.property.dto.UnitSummaryDTO u = unitFacade.getUnitById(r.getLease().getUnitId()).orElse(null);
                    return u != null ? u.propertyId() : null;
                });
    }

    @Override
    public ChargeConfigResponse getChargeConfigById(UUID chargeConfigId) {
        return chargeConfigQueryService.getChargeConfigById(chargeConfigId);
    }

    @Override
    public RevenueMetricsDTO getRevenueMetrics(List<UUID> propertyIds, String billingMonth) {
        com.livic.services.finance.dto.RevenueMetricsDTO m = rentCycleCrudService.getRevenueMetrics(propertyIds, billingMonth);
        return new RevenueMetricsDTO(m.expected(), m.collected());
    }

    @Override
    public List<DefaulterRecordDTO> getDefaulters(List<UUID> propertyIds) {
        return getDefaulters(propertyIds, Pageable.unpaged()).getContent();
    }

    @Override
    public Page<DefaulterRecordDTO> getDefaulters(List<UUID> propertyIds, Pageable pageable) {
        Page<com.livic.services.finance.dto.DefaulterRecordDTO> page = rentCycleCrudService.getDefaulters(propertyIds, pageable);
        return page.map(d -> new DefaulterRecordDTO(d.tenantId(), d.unitNumber(), d.propertyName(), d.dueDate(), d.amountDue(), d.rentCycleId()));
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
                .map(com.livic.services.property.dto.UnitSummaryDTO::unitNumber)
                .orElse(null);
        return UnitBookingMapper.toResponse(unitBookingCrudService.save(UnitBookingMapper.toEntity(request)), unitNumber);
    }
}
