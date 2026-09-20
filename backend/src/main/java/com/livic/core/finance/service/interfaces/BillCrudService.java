package com.livic.core.finance.service.interfaces;

import com.livic.platform.common.service.interfaces.CrudService;
import com.livic.core.finance.domain.RentCycleTbl;
import com.livic.core.finance.dto.DefaulterRecordDTO;
import com.livic.core.finance.dto.RevenueMetricsDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.livic.core.finance.domain.RentCycleStatus;
import com.livic.core.finance.dto.RentCycleDTOs;
import com.livic.core.finance.dto.RentCycleDTOs.RentRollMetricsDTO;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RentCycleCrudService extends CrudService<RentCycleTbl, UUID> {
    Optional<RentCycleTbl> findByLease_IdAndBillingMonth(UUID leaseId, String billingMonth);
    List<RentCycleTbl> findByLease_Id(UUID leaseId);
    List<RentCycleTbl> findByLease_IdInAndBillingMonth(List<UUID> leaseIds, String billingMonth);
    List<RentCycleTbl> findByBillingMonth(String billingMonth);
    List<RentCycleTbl> findByPropertyIdAndBillingMonth(UUID propertyId, String billingMonth);
    Page<RentCycleTbl> findAll(Specification<RentCycleTbl> spec, Pageable pageable);
    List<RentCycleTbl> findAll(Specification<RentCycleTbl> spec);

    RevenueMetricsDTO getRevenueMetrics(Collection<UUID> propertyIds, String billingMonth);
    Page<DefaulterRecordDTO> getDefaulters(Collection<UUID> propertyIds, Pageable pageable);
    RentRollMetricsDTO getRentRollMetrics(
            UUID propertyId,
            String billingMonth,
            RentCycleStatus statusPending,
            RentCycleStatus statusPublished,
            RentCycleStatus statusPaid,
            RentCycleStatus statusOverdue,
            RentCycleStatus statusPartiallyPaid
    );
    RentRollMetricsDTO getRentRollMetricsForProperties(
            Collection<UUID> propertyIds,
            String billingMonth,
            RentCycleStatus statusPending,
            RentCycleStatus statusPublished,
            RentCycleStatus statusPaid,
            RentCycleStatus statusOverdue,
            RentCycleStatus statusPartiallyPaid
    );
}
