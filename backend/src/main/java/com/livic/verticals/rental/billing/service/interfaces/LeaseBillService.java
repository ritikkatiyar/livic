package com.livic.verticals.rental.billing.service.interfaces;

import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.dto.BillDTOs;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/** The bills of one lease: core lists bills by payer, rental knows which payer a lease is. */
public interface LeaseBillService {

    /** The lease's tenant sees published bills only; staff also see drafts. */
    BillDTOs.BillListResponse listForLease(UUID leaseId, UUID currentUserId, String billingMonth, BillStatus status, Pageable pageable);
}
