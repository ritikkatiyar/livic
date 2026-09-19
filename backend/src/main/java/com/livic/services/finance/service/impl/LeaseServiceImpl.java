package com.livic.services.finance.service.impl;

import com.livic.platform.common.domain.LeaseStatus;
import com.livic.platform.common.domain.LedgerTransactionType;
import com.livic.platform.common.domain.UnitBookingStatus;
import com.livic.platform.common.exception.BusinessException;
import com.livic.services.finance.domain.FinanceLedgerTbl;
import com.livic.services.finance.domain.LeaseTbl;
import com.livic.services.finance.domain.UnitBookingTbl;
import com.livic.services.finance.dto.LeaseDTOs;
import com.livic.services.finance.mapper.LeaseMapper;
import com.livic.services.finance.service.interfaces.FinanceLedgerCrudService;
import com.livic.services.finance.service.interfaces.LeaseCrudService;
import com.livic.services.finance.service.interfaces.LeaseService;
import com.livic.services.finance.service.interfaces.LeaseQueryService;
import com.livic.services.finance.service.interfaces.UnitBookingCrudService;
import com.livic.services.property.dto.UnitSummaryDTO;
import com.livic.services.property.facade.UnitFacade;
import com.livic.services.property.facade.UnitMemberFacade;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LeaseServiceImpl implements LeaseService {

    private final LeaseCrudService leaseCrudService;
    private final LeaseQueryService leaseQueryService;
    private final UnitFacade unitFacade;
    private final UnitMemberFacade unitMemberFacade;
    private final UserFacade userFacade;
    private final UnitBookingCrudService unitBookingCrudService;
    private final FinanceLedgerCrudService financeLedgerCrudService;

    @Override
    public LeaseTbl createLease(LeaseDTOs.CreateLeaseRequest request, UUID assignedByUserId) {
        // 1. Dynamic unit availability safety check
        boolean available = leaseQueryService.isUnitAvailableOnDate(request.unitId(), request.moveInDate());
        if (!available) {
            throw new BusinessException(HttpStatus.CONFLICT, "Unit capacity has been reached for the selected move-in date");
        }

        UnitSummaryDTO unitSummary = unitFacade.getUnitById(request.unitId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit not found"));
        
        if (request.moveOutDate() != null && request.moveOutDate().isBefore(request.moveInDate())) {
            throw new BusinessException("moveOutDate cannot be before moveInDate");
        }

        UnitBookingTbl booking = null;
        UUID targetUserId = request.userId();

        // 2. Process booking conversion and auto-register prospective tenant if needed
        if (request.bookingId() != null) {
            booking = unitBookingCrudService.findById(request.bookingId())
                    .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit booking not found"));

            if (!UnitBookingStatus.BOOKED.name().equals(booking.getStatus())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Booking is not in BOOKED status");
            }
            if (booking.getPaymentTransactionId() == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Token payment has not been collected for this booking");
            }

            if (targetUserId == null) {
                // Check if user already exists
                UserSummaryDTO existingUser = null;
                if (booking.getProspectiveTenantEmail() != null) {
                    existingUser = userFacade.getUserByEmail(booking.getProspectiveTenantEmail()).orElse(null);
                }

                if (existingUser != null) {
                    targetUserId = existingUser.id();
                } else {
                    // Create prospective tenant account dynamically
                    String email = booking.getProspectiveTenantEmail();
                    if (email == null || email.isBlank()) {
                        email = "tenant_" + booking.getProspectiveTenantPhone() + "@tenantliving.com";
                    }
                    UserSummaryDTO createdUser = userFacade.createUser(
                            email,
                            booking.getProspectiveTenantName(),
                            booking.getProspectiveTenantPhone(),
                            booking.getProspectiveTenantPhone()
                    );
                    targetUserId = createdUser.id();
                }
            }
        }

        if (targetUserId == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "User ID is required for lease creation when no booking is converted");
        }

        userFacade.getUserById(targetUserId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));

        LeaseTbl lease = LeaseMapper.toEntity(request, unitSummary.id(), targetUserId);
        LeaseTbl saved = leaseCrudService.save(lease);

        // The tenant becomes a member of the unit, in the same transaction as the lease, so
        // everything that asks "who is in this flat" sees them without reading leases.
        unitMemberFacade.addTenant(unitSummary.id(), targetUserId, saved.getId(), saved.getMoveInDate(), assignedByUserId);

        // 3. Mark booking as converted
        if (booking != null) {
            booking.setStatus(UnitBookingStatus.CONVERTED.name());
            booking.setConvertedLeaseId(saved.getId());
            unitBookingCrudService.save(booking);
        }

        // 4. Log Security Deposit Billing DEBIT in ledger
        BigDecimal currentBalance = financeLedgerCrudService.sumAmountByLeaseId(saved.getId());
        BigDecimal newBalance = currentBalance.add(request.securityDeposit());

        FinanceLedgerTbl ledgerEntry = FinanceLedgerTbl.builder()
                .unitId(unitSummary.id())
                .lease(saved)
                .transactionType(LedgerTransactionType.INVOICE_GENERATED)
                .amount(request.securityDeposit())
                .balance(newBalance)
                .referenceId(saved.getId())
                .description("Security Deposit Invoice")
                .build();
        financeLedgerCrudService.save(ledgerEntry);

        log.info("lease_created leaseId={} userId={} unitId={} status={}",
                saved.getId(), saved.getUserId(), saved.getUnitId(), saved.getStatus());
        return saved;
    }

    @Override
    public LeaseTbl terminateLease(UUID id) {
        LeaseTbl lease = leaseCrudService.findWithUnitAndPropertyById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Lease not found"));

        lease.setStatus(LeaseStatus.ENDED);
        if (lease.getMoveOutDate() == null) {
            lease.setMoveOutDate(LocalDate.now());
        }
        LeaseTbl ended = leaseCrudService.save(lease);
        unitMemberFacade.endTenancy(ended.getId(), ended.getMoveOutDate());
        return ended;
    }

    @Override
    public LeaseTbl updateNoticePeriod(UUID id, LocalDate moveOutDate) {
        LeaseTbl lease = leaseCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Lease not found"));
        lease.setMoveOutDate(moveOutDate);
        return leaseCrudService.save(lease);
    }

    @Override
    public LeaseTbl updateLeaseTerms(UUID id, BigDecimal monthlyRentAmount, BigDecimal securityDeposit) {
        LeaseTbl lease = leaseCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Lease not found"));
        if (monthlyRentAmount != null) {
            lease.setMonthlyRentAmount(monthlyRentAmount);
        }
        if (securityDeposit != null) {
            lease.setSecurityDeposit(securityDeposit);
        }
        return leaseCrudService.save(lease);
    }
}
