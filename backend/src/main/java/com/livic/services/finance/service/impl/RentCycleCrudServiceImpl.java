package com.livic.services.finance.service.impl;

import com.livic.platform.common.domain.LeaseStatus;
import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.services.finance.domain.LeaseTbl;
import com.livic.services.finance.domain.RentCycleStatus;
import com.livic.services.finance.domain.RentCycleTbl;
import com.livic.services.finance.dto.DefaulterRecordDTO;
import com.livic.services.finance.dto.RentCycleDTOs;
import com.livic.services.finance.dto.RentCycleDTOs.RentRollMetricsDTO;
import com.livic.services.finance.dto.RevenueMetricsDTO;
import com.livic.services.finance.repository.LeaseRepository;
import com.livic.services.finance.repository.RentCycleRepository;
import com.livic.services.finance.service.interfaces.RentCycleCrudService;
import com.livic.services.property.dto.UnitSummaryDTO;
import com.livic.services.property.facade.UnitFacade;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class RentCycleCrudServiceImpl extends AbstractCrudService<RentCycleTbl, UUID, RentCycleRepository> implements RentCycleCrudService {

    private final LeaseRepository leaseRepository;
    private final UnitFacade unitFacade;

    public RentCycleCrudServiceImpl(
            RentCycleRepository rentCycleRepository,
            LeaseRepository leaseRepository,
            UnitFacade unitFacade) {
        super(rentCycleRepository);
        this.leaseRepository = leaseRepository;
        this.unitFacade = unitFacade;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RentCycleTbl> findByLease_IdAndBillingMonth(UUID leaseId, String billingMonth) {
        return repository.findByLease_IdAndBillingMonth(leaseId, billingMonth);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentCycleTbl> findByLease_Id(UUID leaseId) {
        return repository.findByLease_Id(leaseId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentCycleTbl> findByLease_IdInAndBillingMonth(List<UUID> leaseIds, String billingMonth) {
        if (leaseIds == null || leaseIds.isEmpty()) {
            return Collections.emptyList();
        }
        return repository.findByLease_IdInAndBillingMonth(leaseIds, billingMonth);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentCycleTbl> findByBillingMonth(String billingMonth) {
        return repository.findByBillingMonth(billingMonth);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentCycleTbl> findByPropertyIdAndBillingMonth(UUID propertyId, String billingMonth) {
        List<UUID> leaseIds = getLeaseIdsForProperty(propertyId);
        if (leaseIds.isEmpty()) {
            return Collections.emptyList();
        }
        return repository.findByLease_IdInAndBillingMonth(leaseIds, billingMonth);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RentCycleTbl> findAll(Specification<RentCycleTbl> spec, Pageable pageable) {
        return repository.findAll(spec, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentCycleTbl> findAll(Specification<RentCycleTbl> spec) {
        return repository.findAll(spec);
    }

    @Override
    @Transactional(readOnly = true)
    public RevenueMetricsDTO getRevenueMetrics(Collection<UUID> propertyIds, String billingMonth) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return new RevenueMetricsDTO(BigDecimal.ZERO, BigDecimal.ZERO);
        }
        List<UUID> leaseIds = getLeaseIdsForProperties(propertyIds);
        if (leaseIds.isEmpty()) {
            return new RevenueMetricsDTO(BigDecimal.ZERO, BigDecimal.ZERO);
        }
        RevenueMetricsDTO metrics = repository.calculateRevenueMetrics(leaseIds, billingMonth, RentCycleStatus.PAID);
        return metrics != null ? metrics : new RevenueMetricsDTO(BigDecimal.ZERO, BigDecimal.ZERO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DefaulterRecordDTO> getDefaulters(Collection<UUID> propertyIds, Pageable pageable) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return Page.empty(pageable);
        }
        List<UUID> leaseIds = getLeaseIdsForProperties(propertyIds);
        if (leaseIds.isEmpty()) {
            return Page.empty(pageable);
        }
        Page<RentCycleTbl> defaulterCycles = repository.findDefaulterCycles(
                leaseIds,
                RentCycleStatus.OVERDUE,
                RentCycleStatus.PENDING,
                LocalDate.now(),
                pageable
        );

        Set<UUID> unitIds = defaulterCycles.getContent().stream()
                .map(c -> c.getLease() != null ? c.getLease().getUnitId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, UnitSummaryDTO> unitsMap = unitIds.isEmpty() ? Map.of() : unitFacade.getUnitsByIds(unitIds);

        return defaulterCycles.map(cycle -> {
            LeaseTbl lease = cycle.getLease();
            UnitSummaryDTO unitSummary = lease != null && lease.getUnitId() != null ? unitsMap.get(lease.getUnitId()) : null;
            String unitNumber = unitSummary != null ? unitSummary.unitNumber() : "Vacant";
            String propertyName = unitSummary != null ? unitSummary.propertyName() : "N/A";
            return new DefaulterRecordDTO(
                    lease != null ? lease.getUserId() : null,
                    unitNumber,
                    propertyName,
                    cycle.getDueDate(),
                    cycle.getTotalAmount(),
                    cycle.getId()
            );
        });
    }

    @Override
    @Transactional(readOnly = true)
    public RentRollMetricsDTO getRentRollMetrics(
            UUID propertyId,
            String billingMonth,
            RentCycleStatus statusPending,
            RentCycleStatus statusPublished,
            RentCycleStatus statusPaid,
            RentCycleStatus statusOverdue,
            RentCycleStatus statusPartiallyPaid
    ) {
        return getRentRollMetricsForProperties(
                propertyId != null ? List.of(propertyId) : Collections.emptyList(),
                billingMonth,
                statusPending,
                statusPublished,
                statusPaid,
                statusOverdue,
                statusPartiallyPaid
        );
    }

    @Override
    @Transactional(readOnly = true)
    public RentRollMetricsDTO getRentRollMetricsForProperties(
            Collection<UUID> propertyIds,
            String billingMonth,
            RentCycleStatus statusPending,
            RentCycleStatus statusPublished,
            RentCycleStatus statusPaid,
            RentCycleStatus statusOverdue,
            RentCycleStatus statusPartiallyPaid
    ) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return new RentRollMetricsDTO(BigDecimal.ZERO, 0L, 0L);
        }
        List<UUID> leaseIds = getLeaseIdsForProperties(propertyIds);
        if (leaseIds.isEmpty()) {
            return new RentRollMetricsDTO(BigDecimal.ZERO, 0L, 0L);
        }
        List<Object[]> metrics = repository.getRentRollMetrics(
                leaseIds,
                billingMonth,
                statusPending,
                statusPublished,
                statusPaid,
                statusOverdue,
                statusPartiallyPaid
        );

        BigDecimal totalExpectedRevenue = BigDecimal.ZERO;
        long pendingDraftsCount = 0;
        long publishedCount = 0;

        if (metrics != null && !metrics.isEmpty() && metrics.get(0) != null) {
            Object[] row = metrics.get(0);
            totalExpectedRevenue = (BigDecimal) (row[0] != null ? row[0] : BigDecimal.ZERO);
            pendingDraftsCount = ((Number) (row[1] != null ? row[1] : 0L)).longValue();
            publishedCount = ((Number) (row[2] != null ? row[2] : 0L)).longValue();
        }

        return new RentRollMetricsDTO(
                totalExpectedRevenue,
                pendingDraftsCount,
                publishedCount
        );
    }

    private List<UUID> getLeaseIdsForProperty(UUID propertyId) {
        if (propertyId == null) {
            return Collections.emptyList();
        }
        return getLeaseIdsForProperties(List.of(propertyId));
    }

    private List<UUID> getLeaseIdsForProperties(Collection<UUID> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<UnitSummaryDTO> units = unitFacade.getUnitsByPropertyIds(propertyIds);
        if (units.isEmpty()) {
            return Collections.emptyList();
        }
        List<UUID> unitIds = units.stream().map(UnitSummaryDTO::id).toList();
        return leaseRepository.findByUnitIdInAndStatus(unitIds, LeaseStatus.ACTIVE).stream()
                .map(LeaseTbl::getId)
                .toList();
    }
}
