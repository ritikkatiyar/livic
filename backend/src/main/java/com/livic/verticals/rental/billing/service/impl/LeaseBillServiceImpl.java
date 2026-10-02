package com.livic.verticals.rental.billing.service.impl;

import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.core.finance.facade.FinanceFacade;
import com.livic.verticals.rental.billing.service.interfaces.LeaseBillService;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.verticals.rental.lease.service.interfaces.LeaseQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LeaseBillServiceImpl implements LeaseBillService {

    private final LeaseQueryService leaseQueryService;
    private final FinanceFacade financeFacade;

    @Override
    @Transactional(readOnly = true)
    public BillDTOs.BillListResponse listForLease(UUID leaseId, UUID currentUserId, String billingMonth, BillStatus status, Pageable pageable) {
        LeaseTbl lease = leaseQueryService.getLeaseById(leaseId);
        boolean isTenant = lease.getUserId() != null && lease.getUserId().equals(currentUserId);
        return financeFacade.listBillsForMember(lease.getMemberId(), billingMonth, status, !isTenant, pageable);
    }
}
