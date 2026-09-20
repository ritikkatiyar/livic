package com.livic.core.finance.service.interfaces;

import com.livic.platform.common.service.interfaces.CrudService;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.dto.DefaulterRecordDTO;
import com.livic.core.finance.dto.RevenueMetricsDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.domain.BillType;
import com.livic.core.finance.dto.RentRollMetricsDTO;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BillCrudService extends CrudService<BillTbl, UUID> {
    Optional<BillTbl> findByMemberIdAndBillingMonth(UUID memberId, String billingMonth, BillType billType);
    List<BillTbl> findByMemberId(UUID memberId);
    List<BillTbl> findByMemberIdInAndBillingMonth(Collection<UUID> memberIds, String billingMonth);
    List<BillTbl> findByBillingMonth(String billingMonth);
    List<BillTbl> findByPropertyIdAndBillingMonth(UUID propertyId, String billingMonth);
    Page<BillTbl> findAll(Specification<BillTbl> spec, Pageable pageable);
    List<BillTbl> findAll(Specification<BillTbl> spec);

    RevenueMetricsDTO getRevenueMetrics(Collection<UUID> propertyIds, String billingMonth);
    Page<DefaulterRecordDTO> getDefaulters(Collection<UUID> propertyIds, Pageable pageable);
    RentRollMetricsDTO getRentRollMetrics(
            UUID propertyId,
            String billingMonth,
            BillStatus statusPending,
            BillStatus statusPublished,
            BillStatus statusPaid,
            BillStatus statusOverdue,
            BillStatus statusPartiallyPaid
    );
    RentRollMetricsDTO getRentRollMetricsForProperties(
            Collection<UUID> propertyIds,
            String billingMonth,
            BillStatus statusPending,
            BillStatus statusPublished,
            BillStatus statusPaid,
            BillStatus statusOverdue,
            BillStatus statusPartiallyPaid
    );
}
