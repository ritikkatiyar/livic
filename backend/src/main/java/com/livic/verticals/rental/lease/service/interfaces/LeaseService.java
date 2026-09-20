package com.livic.verticals.rental.lease.service.interfaces;

import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.verticals.rental.lease.dto.LeaseDTOs;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface LeaseService {
    LeaseTbl createLease(LeaseDTOs.CreateLeaseRequest request, UUID assignedByUserId);
    LeaseTbl terminateLease(UUID id);
    LeaseTbl updateNoticePeriod(UUID id, LocalDate moveOutDate);
    LeaseTbl updateLeaseTerms(UUID id, BigDecimal monthlyRentAmount, BigDecimal securityDeposit);
}
