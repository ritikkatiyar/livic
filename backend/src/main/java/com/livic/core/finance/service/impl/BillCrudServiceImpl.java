package com.livic.core.finance.service.impl;

import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.domain.BillType;
import com.livic.core.finance.dto.DefaulterRecordDTO;
import com.livic.core.finance.dto.BillDTOs.RentRollMetricsDTO;
import com.livic.core.finance.dto.RevenueMetricsDTO;
import com.livic.core.finance.repository.BillRepository;
import com.livic.core.finance.service.interfaces.BillCrudService;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.UnitFacade;
import com.livic.core.property.facade.UnitMemberFacade;
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
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Bills are reached through the property id carried on the bill, not by first resolving a
 * property to its active leases. That older path both excluded owners, who have no lease at
 * all, and quietly dropped the unpaid bills of tenancies that had already ended.
 */
@Service
@Transactional
public class BillCrudServiceImpl extends AbstractCrudService<BillTbl, UUID, BillRepository> implements BillCrudService {

    private final UnitFacade unitFacade;
    private final UnitMemberFacade unitMemberFacade;

    public BillCrudServiceImpl(
            BillRepository billRepository,
            UnitFacade unitFacade,
            UnitMemberFacade unitMemberFacade) {
        super(billRepository);
        this.unitFacade = unitFacade;
        this.unitMemberFacade = unitMemberFacade;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<BillTbl> findByMemberIdAndBillingMonth(UUID memberId, String billingMonth, BillType billType) {
        return repository.findByMemberIdAndBillingMonthAndBillType(memberId, billingMonth, billType);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillTbl> findByMemberId(UUID memberId) {
        return repository.findByMemberId(memberId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillTbl> findByMemberIdInAndBillingMonth(Collection<UUID> memberIds, String billingMonth) {
        if (memberIds == null || memberIds.isEmpty()) {
            return Collections.emptyList();
        }
        return repository.findByMemberIdInAndBillingMonth(memberIds, billingMonth);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillTbl> findByBillingMonth(String billingMonth) {
        return repository.findByBillingMonth(billingMonth);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillTbl> findByPropertyIdAndBillingMonth(UUID propertyId, String billingMonth) {
        if (propertyId == null) {
            return Collections.emptyList();
        }
        return repository.findByPropertyIdAndBillingMonth(propertyId, billingMonth);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BillTbl> findAll(Specification<BillTbl> spec, Pageable pageable) {
        return repository.findAll(spec, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillTbl> findAll(Specification<BillTbl> spec) {
        return repository.findAll(spec);
    }

    @Override
    @Transactional(readOnly = true)
    public RevenueMetricsDTO getRevenueMetrics(Collection<UUID> propertyIds, String billingMonth) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return new RevenueMetricsDTO(BigDecimal.ZERO, BigDecimal.ZERO);
        }
        RevenueMetricsDTO metrics = repository.calculateRevenueMetrics(propertyIds, billingMonth, BillStatus.PAID);
        return metrics != null ? metrics : new RevenueMetricsDTO(BigDecimal.ZERO, BigDecimal.ZERO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DefaulterRecordDTO> getDefaulters(Collection<UUID> propertyIds, Pageable pageable) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return Page.empty(pageable);
        }
        Page<BillTbl> defaulters = repository.findDefaulterBills(
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
                    bill.getDueDate(),
                    bill.getTotalAmount(),
                    bill.getId()
            );
        });
    }

    @Override
    @Transactional(readOnly = true)
    public RentRollMetricsDTO getRentRollMetrics(
            UUID propertyId,
            String billingMonth,
            BillStatus statusPending,
            BillStatus statusPublished,
            BillStatus statusPaid,
            BillStatus statusOverdue,
            BillStatus statusPartiallyPaid
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
            BillStatus statusPending,
            BillStatus statusPublished,
            BillStatus statusPaid,
            BillStatus statusOverdue,
            BillStatus statusPartiallyPaid
    ) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return new RentRollMetricsDTO(BigDecimal.ZERO, 0L, 0L);
        }
        List<Object[]> metrics = repository.getRentRollMetrics(
                propertyIds,
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
}
