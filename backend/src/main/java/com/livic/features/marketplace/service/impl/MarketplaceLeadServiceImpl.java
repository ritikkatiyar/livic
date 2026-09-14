package com.livic.features.marketplace.service.impl;

import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.domain.LeadType;
import com.livic.platform.common.exception.BusinessException;
import com.livic.features.marketplace.domain.MarketplaceLeadTbl;
import com.livic.features.marketplace.dto.MarketplaceLeadDTOs;
import com.livic.features.marketplace.mapper.MarketplaceLeadMapper;
import com.livic.features.marketplace.repository.MarketplaceLeadRepository;
import com.livic.features.marketplace.service.interfaces.MarketplaceLeadService;
import com.livic.features.marketplace.service.interfaces.OtpService;
import com.livic.platform.payment.domain.PaymentTransactionTbl;
import com.livic.platform.payment.service.interfaces.PaymentTransactionService;
import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.domain.UnitTbl;
import com.livic.services.property.repository.PropertyRepository;
import com.livic.services.property.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MarketplaceLeadServiceImpl implements MarketplaceLeadService {

    private final MarketplaceLeadRepository leadRepository;
    private final PropertyRepository propertyRepository;
    private final UnitRepository unitRepository;
    private final OtpService otpService;
    private final PaymentTransactionService paymentTransactionService;

    @Value("${app.razorpay.key-id:rzp_test_livic_key}")
    private String razorpayKeyId;

    private static final BigDecimal DEFAULT_TOKEN_AMOUNT = new BigDecimal("2000.00");

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

        // 2. Validate Property
        PropertyTbl property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Property not found with id: " + propertyId));
        if (!property.isPubliclyListed() || !property.isActive()) {
            throw new BusinessException("Property is not publicly listed or active");
        }

        // 3. Validate Unit
        UnitTbl unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit not found with id: " + unitId));
        if (!unit.getProperty().getId().equals(propertyId)) {
            throw new BusinessException("Unit does not belong to specified property");
        }

        // 4. Validate Lead Type Specific Rules
        BigDecimal tokenAmount = null;
        if (request.leadType() == LeadType.BOOKING) {
            if (!unit.isBookable()) {
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
            if (request.preferredSlot().isBefore(Instant.now())) {
                throw new BusinessException("Preferred slot timestamp must be in the future");
            }
        }

        // 5. Build and save Lead entity
        MarketplaceLeadTbl lead = MarketplaceLeadTbl.builder()
                .property(property)
                .unit(unit)
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

        leadRepository.save(lead);
        log.info("Created marketplace lead: id={}, type={}, phone={}", lead.getId(), lead.getLeadType(), lead.getProspectPhone());

        return MarketplaceLeadMapper.toResponse(lead);
    }

    @Override
    @Transactional(readOnly = true)
    public MarketplaceLeadDTOs.LeadResponse getLeadStatus(UUID leadId) {
        MarketplaceLeadTbl lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Marketplace lead not found with id: " + leadId));
        return MarketplaceLeadMapper.toResponse(lead);
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
        UUID pseudoPayerId = lead.getId();

        // Delegate online payment initiation to payment transaction service
        PaymentTransactionTbl transaction = paymentTransactionService.initiateOnlinePayment(
                pseudoPayerId,
                "MARKETPLACE_LEAD",
                lead.getId(),
                amount
        );

        lead.setPaymentTransaction(transaction);
        leadRepository.save(lead);

        return new MarketplaceLeadDTOs.TokenPaymentInitResponse(
                lead.getId(),
                transaction.getId(),
                transaction.getGatewayTransactionId(),
                amount,
                "INR",
                razorpayKeyId
        );
    }
}
