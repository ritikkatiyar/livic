package com.livic.verticals.rental.lease.dto;

import com.livic.verticals.rental.lease.domain.LeaseSplitStrategy;
import com.livic.verticals.rental.lease.domain.LeaseStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class LeaseDTOs {

    public record CreateLeaseRequest(
            UUID userId,
            @NotNull(message = "Unit ID is required") UUID unitId,
            @NotNull(message = "Monthly rent amount is required") @PositiveOrZero(message = "Monthly rent amount must be zero or positive") BigDecimal monthlyRentAmount,
            @NotNull(message = "Security deposit is required") @PositiveOrZero(message = "Security deposit must be zero or positive") BigDecimal securityDeposit,
            @NotNull(message = "Split strategy is required") LeaseSplitStrategy splitStrategy,
            @NotNull(message = "Move-in date is required") LocalDate moveInDate,
            LocalDate moveOutDate,
            LeaseStatus status,
            UUID bookingId
    ) {}

    /** {@code memberId} is the unit member the lease makes the tenant; core's unit views list members. */
    public record LeaseResponse(
            UUID id,
            UUID userId,
            UUID memberId,
            UUID unitId,
            UUID blockId,
            String blockName,
            String unitNumber,
            String propertyName,
            String tenantName,
            String tenantPhone,
            BigDecimal monthlyRentAmount,
            BigDecimal securityDeposit,
            LeaseSplitStrategy splitStrategy,
            LocalDate moveInDate,
            LocalDate moveOutDate,
            LeaseStatus status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        public LeaseResponse(
                UUID id,
                UUID userId,
                UUID memberId,
                UUID unitId,
                String unitNumber,
                String propertyName,
                String tenantName,
                String tenantPhone,
                BigDecimal monthlyRentAmount,
                BigDecimal securityDeposit,
                LeaseSplitStrategy splitStrategy,
                LocalDate moveInDate,
                LocalDate moveOutDate,
                LeaseStatus status,
                LocalDateTime createdAt,
                LocalDateTime updatedAt
        ) {
            this(id, userId, memberId, unitId, null, null, unitNumber, propertyName, tenantName, tenantPhone, monthlyRentAmount, securityDeposit, splitStrategy, moveInDate, moveOutDate, status, createdAt, updatedAt);
        }
    }

    public record UpdateLeaseTermsRequest(
            @NotNull(message = "Monthly rent amount is required") @PositiveOrZero(message = "Monthly rent amount must be zero or positive") BigDecimal monthlyRentAmount,
            @NotNull(message = "Security deposit is required") @PositiveOrZero(message = "Security deposit must be zero or positive") BigDecimal securityDeposit
    ) {}
}
