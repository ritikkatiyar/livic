package com.livic.verticals.rental.lease.service.impl;

import com.livic.verticals.rental.booking.dto.UnitBookingDTOs.UnitBookingResponse;
import com.livic.verticals.rental.booking.facade.BookingFacade;
import com.livic.core.finance.facade.FinanceFacade;
import com.livic.verticals.rental.lease.repository.LeaseRepository;
import com.livic.verticals.rental.lease.domain.LeaseStatus;
import com.livic.core.finance.domain.LedgerTransactionType;
import com.livic.platform.common.exception.BusinessException;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.verticals.rental.lease.dto.LeaseDTOs;
import com.livic.verticals.rental.lease.mapper.LeaseMapper;
import com.livic.verticals.rental.lease.service.interfaces.LeaseService;
import com.livic.verticals.rental.lease.service.interfaces.LeaseQueryService;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.UnitFacade;
import com.livic.core.property.facade.UnitMemberFacade;
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

    private final LeaseRepository leaseRepository;
    private final LeaseQueryService leaseQueryService;
    private final UnitFacade unitFacade;
    private final UnitMemberFacade unitMemberFacade;
    private final UserFacade userFacade;
    private final BookingFacade bookingFacade;
    private final FinanceFacade financeFacade;

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

        UnitBookingResponse booking = null;
        UUID targetUserId = request.userId();

        // 2. Process booking conversion and auto-register prospective tenant if needed
        if (request.bookingId() != null) {
            booking = bookingFacade.getConvertibleBooking(request.bookingId());

            if (targetUserId == null) {
                // Check if user already exists
                UserSummaryDTO existingUser = null;
                if (booking.prospectiveTenantEmail() != null) {
                    existingUser = userFacade.getUserByEmail(booking.prospectiveTenantEmail()).orElse(null);
                }

                if (existingUser != null) {
                    targetUserId = existingUser.id();
                } else {
                    // Create prospective tenant account dynamically
                    String email = booking.prospectiveTenantEmail();
                    if (email == null || email.isBlank()) {
                        email = "tenant_" + booking.prospectiveTenantPhone() + "@tenantliving.com";
                    }
                    UserSummaryDTO createdUser = userFacade.createUser(
                            email,
                            booking.prospectiveTenantName(),
                            booking.prospectiveTenantPhone(),
                            booking.prospectiveTenantPhone()
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

        // The tenant becomes a member of the unit, in the same transaction as the lease, so
        // everything that asks "who is in this flat" sees them without reading leases. The lease
        // keeps the member's id; core never learns there is a lease.
        LeaseTbl lease = LeaseMapper.toEntity(request, unitSummary.id(), targetUserId);
        var tenantMember = unitMemberFacade.addTenant(unitSummary.id(), targetUserId, lease.getMoveInDate(), assignedByUserId);
        lease.setMemberId(tenantMember.id());
        LeaseTbl saved = leaseRepository.save(lease);

        // 3. Mark booking as converted
        if (booking != null) {
            bookingFacade.markConverted(booking.id(), saved.getId());
        }

        // 4. The security deposit is owed from move-in, so it opens the tenant's ledger.
        financeFacade.postLedgerEntry(tenantMember.id(), unitSummary.id(), LedgerTransactionType.INVOICE_GENERATED,
                request.securityDeposit(), saved.getId(), "Security Deposit Invoice");

        log.info("lease_created leaseId={} userId={} unitId={} status={}",
                saved.getId(), saved.getUserId(), saved.getUnitId(), saved.getStatus());
        return saved;
    }

    @Override
    public LeaseTbl terminateLease(UUID id) {
        LeaseTbl lease = leaseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Lease not found"));

        lease.setStatus(LeaseStatus.ENDED);
        if (lease.getMoveOutDate() == null) {
            lease.setMoveOutDate(LocalDate.now());
        }
        LeaseTbl ended = leaseRepository.save(lease);
        unitMemberFacade.endMembership(ended.getMemberId(), ended.getMoveOutDate());
        return ended;
    }

    @Override
    public LeaseTbl updateNoticePeriod(UUID id, LocalDate moveOutDate) {
        LeaseTbl lease = leaseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Lease not found"));
        lease.setMoveOutDate(moveOutDate);
        return leaseRepository.save(lease);
    }

    @Override
    public LeaseTbl updateLeaseTerms(UUID id, BigDecimal monthlyRentAmount, BigDecimal securityDeposit) {
        LeaseTbl lease = leaseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Lease not found"));
        if (monthlyRentAmount != null) {
            lease.setMonthlyRentAmount(monthlyRentAmount);
        }
        if (securityDeposit != null) {
            lease.setSecurityDeposit(securityDeposit);
        }
        return leaseRepository.save(lease);
    }
}
