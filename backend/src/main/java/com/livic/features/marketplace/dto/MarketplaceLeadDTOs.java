package com.livic.features.marketplace.dto;

import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.domain.LeadType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class MarketplaceLeadDTOs {

    public record CreateLeadRequest(
        @NotNull LeadType leadType,
        @NotBlank String prospectName,
        @NotBlank @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be a valid 10-digit number") String prospectPhone,
        @Email String prospectEmail,
        Instant preferredSlot,
        LocalDate expectedMoveInDate,
        BigDecimal tokenAmount,
        String source
    ) {}

    public record LeadResponse(
        UUID id,
        UUID propertyId,
        UUID unitId,
        LeadType leadType,
        LeadStatus status,
        String prospectName,
        String prospectPhone,
        String prospectEmail,
        Instant preferredSlot,
        LocalDate expectedMoveInDate,
        BigDecimal tokenAmount,
        UUID paymentTransactionId,
        UUID convertedUnitBookingId,
        LocalDateTime createdAt
    ) {}

    /** Lead status without the prospect's name, phone or email (safe for the public lead-status endpoint). */
    public record LeadStatusResponse(
        UUID id,
        UUID propertyId,
        UUID unitId,
        LeadType leadType,
        LeadStatus status,
        Instant preferredSlot,
        BigDecimal tokenAmount,
        UUID paymentTransactionId,
        UUID convertedUnitBookingId,
        LocalDateTime createdAt
    ) {}

    public record TokenPaymentInitResponse(
        UUID leadId,
        UUID transactionId,
        String razorpayOrderId,
        BigDecimal amount,
        String currency,
        String keyId
    ) {}
}
