package com.livic.features.marketplace.service.impl;

import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.domain.LeadType;
import com.livic.platform.common.exception.BusinessException;
import com.livic.features.marketplace.domain.MarketplaceLeadTbl;
import com.livic.features.marketplace.dto.MarketplaceLeadDTOs;
import com.livic.features.marketplace.dto.TourRequestDTOs;
import com.livic.features.marketplace.exception.DuplicateTourRequestException;
import com.livic.features.marketplace.mapper.MarketplaceLeadMapper;
import com.livic.features.marketplace.repository.MarketplaceLeadRepository;
import com.livic.features.marketplace.service.interfaces.MarketplaceLeadService;
import com.livic.features.marketplace.service.interfaces.OtpService;
import com.livic.features.marketplace.service.interfaces.TourAvailabilityService;
import com.livic.platform.payment.dto.PaymentTransactionResponse;
import com.livic.platform.payment.facade.PaymentFacade;
import com.livic.services.property.dto.UnitListingDTO;
import com.livic.services.property.facade.PropertyFacade;
import com.livic.services.property.facade.UnitFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MarketplaceLeadServiceImpl implements MarketplaceLeadService {

    private final MarketplaceLeadRepository leadRepository;
    private final PropertyFacade propertyFacade;
    private final UnitFacade unitFacade;
    private final OtpService otpService;
    private final PaymentFacade paymentFacade;
    private final TourAvailabilityService tourAvailabilityService;

    @Value("${app.razorpay.key-id:rzp_test_livic_key}")
    private String razorpayKeyId;

    private static final BigDecimal DEFAULT_TOKEN_AMOUNT = new BigDecimal("2000.00");
    private static final List<LeadStatus> ACTIVE_TOUR_STATUSES = List.of(LeadStatus.NEW, LeadStatus.APPROVED);

    @Override
    @Transactional
    public MarketplaceLeadDTOs.LeadResponse createLead(
            UUID propertyId,
            UUID unitId,
            MarketplaceLeadDTOs.CreateLeadRequest request,
            String sessionToken
    ) {
        // 1. Validate OTP session token server-side
        otpService.validateSessionToken(sessionToken, request.prospectPhone());

        // 2. Validate Property (only publicly listed, active properties accept leads)
        if (propertyFacade.getPublicListing(propertyId).isEmpty()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Property not found or not publicly listed: " + propertyId);
        }

        // 3. Validate Unit
        UnitListingDTO unit = unitFacade.getUnitListingById(unitId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit not found with id: " + unitId));
        if (!propertyId.equals(unit.propertyId())) {
            throw new BusinessException("Unit does not belong to specified property");
        }

        // 4. Validate Lead Type Specific Rules
        BigDecimal tokenAmount = null;
        if (request.leadType() == LeadType.BOOKING) {
            if (!unit.bookable()) {
                throw new BusinessException("This unit is currently not available for instant booking");
            }
            // Authoritative server-side token amount determination
            tokenAmount = (request.tokenAmount() != null && request.tokenAmount().compareTo(BigDecimal.ZERO) > 0)
                    ? request.tokenAmount()
                    : DEFAULT_TOKEN_AMOUNT;
        } else if (request.leadType() == LeadType.TOUR_REQUEST) {
            if (request.preferredSlot() == null) {
                throw new BusinessException("Preferred slot timestamp is required for tour requests");
            }
            ensureNoActiveTour(propertyId, request.prospectPhone().trim());
            // One of the property's visiting slots, not past/blocked/full, and not declined for this phone
            tourAvailabilityService.requireBookableSlot(propertyId, request.prospectPhone().trim(), request.preferredSlot());
        }

        // 5. Build and save Lead entity
        MarketplaceLeadTbl lead = MarketplaceLeadTbl.builder()
                .propertyId(propertyId)
                .unitId(unitId)
                .leadType(request.leadType())
                .status(LeadStatus.NEW)
                .prospectName(request.prospectName().trim())
                .prospectPhone(request.prospectPhone().trim())
                .prospectEmail(request.prospectEmail() != null ? request.prospectEmail().trim() : null)
                .preferredSlot(request.preferredSlot())
                .expectedMoveInDate(request.expectedMoveInDate())
                .tokenAmount(tokenAmount)
                .source(request.source() != null ? request.source() : "MARKETPLACE")
                .build();

        try {
            // Flush now so the one-active-tour unique index is checked inside this call
            leadRepository.saveAndFlush(lead);
        } catch (DataIntegrityViolationException e) {
            if (lead.isTourRequest()) {
                // A concurrent submission for the same phone and property won the race
                throw new DuplicateTourRequestException(null);
            }
            throw e;
        }
        log.info("Created marketplace lead: id={}, type={}, phoneEnding={}", lead.getId(), lead.getLeadType(), maskPhone(lead.getProspectPhone()));

        return MarketplaceLeadMapper.toResponse(lead);
    }

    @Override
    @Transactional(readOnly = true)
    public MarketplaceLeadDTOs.LeadStatusResponse getLeadStatus(UUID leadId) {
        MarketplaceLeadTbl lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Marketplace lead not found with id: " + leadId));
        return MarketplaceLeadMapper.toStatusResponse(lead, Instant.now());
    }

    /**
     * One active tour per phone per property. Past-dated active tours are closed first so an old visit never blocks
     * a new request; any remaining active tour is reported back to the prospect.
     */
    private void ensureNoActiveTour(UUID propertyId, String phone) {
        Instant now = Instant.now();
        List<MarketplaceLeadTbl> openTours = leadRepository.findByPropertyIdAndProspectPhoneAndLeadTypeAndStatusIn(
                propertyId, phone, LeadType.TOUR_REQUEST, ACTIVE_TOUR_STATUSES);

        for (MarketplaceLeadTbl tour : openTours) {
            if (tour.closeIfVisitPassed(now)) {
                leadRepository.saveAndFlush(tour);
            } else {
                String unitNumber = unitFacade.getUnitListingById(tour.getUnitId()).map(UnitListingDTO::unitNumber).orElse(null);
                throw new DuplicateTourRequestException(new TourRequestDTOs.ExistingTourRequestSummary(
                        tour.getId(), tour.getUnitId(), unitNumber, tour.getStatus(), tour.getPreferredSlot()));
            }
        }
    }

    static String maskPhone(String phone) {
        return phone != null && phone.length() > 4 ? phone.substring(phone.length() - 4) : "****";
    }

    @Override
    @Transactional
    public MarketplaceLeadDTOs.TokenPaymentInitResponse initiateTokenPayment(UUID leadId) {
        MarketplaceLeadTbl lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Marketplace lead not found with id: " + leadId));

        if (lead.getLeadType() != LeadType.BOOKING) {
            throw new BusinessException("Token payment can only be initiated for BOOKING leads");
        }

        if (lead.getStatus() == LeadStatus.CANCELLED || lead.getStatus() == LeadStatus.REFUNDED) {
            throw new BusinessException("Cannot initiate payment for cancelled or refunded lead");
        }

        BigDecimal amount = lead.getTokenAmount() != null ? lead.getTokenAmount() : DEFAULT_TOKEN_AMOUNT;

        // Delegate online payment initiation to the payment module. The prospect has no account yet, so the
        // transaction has no payer and is identified by the lead it belongs to.
        PaymentTransactionResponse transaction = paymentFacade.initiateOnlinePaymentTransaction(
                null,
                "MARKETPLACE_LEAD",
                lead.getId(),
                amount
        );

        lead.setPaymentTransactionId(transaction.id());
        leadRepository.save(lead);

        return new MarketplaceLeadDTOs.TokenPaymentInitResponse(
                lead.getId(),
                transaction.id(),
                transaction.gatewayTransactionId(),
                amount,
                "INR",
                razorpayKeyId
        );
    }
}
