package com.livic.services.finance.service.interfaces;

import com.livic.services.finance.domain.LeaseTbl;
import com.livic.services.finance.dto.LeaseDTOs;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface LeaseService {
    LeaseTbl createLease(LeaseDTOs.CreateLeaseRequest request, UUID assignedByUserId);
    LeaseTbl terminateLease(UUID id);
    LeaseTbl updateNoticePeriod(UUID id, LocalDate moveOutDate);
    LeaseTbl updateLeaseTerms(UUID id, BigDecimal monthlyRentAmount, BigDecimal securityDeposit);
}
