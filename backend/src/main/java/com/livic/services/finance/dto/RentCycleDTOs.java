package com.livic.services.finance.dto;

import com.livic.platform.common.domain.RentChargeType;
import com.livic.services.finance.domain.RentCycleStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class RentCycleDTOs {

    public record GenerateRentCycleRequest(
            @NotNull UUID leaseId,
            @NotNull @Pattern(regexp = "\\d{4}-\\d{2}", message = "billingMonth must use yyyy-MM") String billingMonth,
            @NotNull LocalDate dueDate
    ) {}

    public record BatchGenerateRentCycleRequest(
            @NotNull UUID propertyId,
            @NotNull @Pattern(regexp = "\\d{4}-\\d{2}", message = "billingMonth must use yyyy-MM") String billingMonth,
            @NotNull LocalDate dueDate
    ) {}

    public record RecordRentCashPaymentRequest(
            @NotNull BigDecimal amount,
            String note,
            UUID payerUserId
    ) {}

    public record PreFlightChecklistResponse(
            int totalUnits,
            int activeLeases,
            int meterReadingsExpected,
            int meterReadingsEntered,
            boolean isReady
    ) {}

    public record ChargeRequest(
            @NotNull RentChargeType chargeType,
            @NotNull BigDecimal amount,
            String description
    ) {}

    public record RentCycleResponse(
            UUID id,
            UUID leaseId,
            String tenantName,
            String unitNumber,
            String billingMonth,
            BigDecimal totalAmount,
            LocalDate dueDate,
            RentCycleStatus status,
            LocalDateTime paidAt,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            List<ChargeResponse> charges
    ) {}

    public record ChargeResponse(
            UUID id,
            RentChargeType chargeType,
            BigDecimal amount,
            String description,
            LocalDateTime createdAt
    ) {}

    public record RentCycleListResponse(
            List<RentCycleResponse> content,
            long totalElements,
            int totalPages,
            int size,
            int number,
            RentRollMetricsDTO metrics
    ) {}

    public record RentRollMetricsDTO(
            BigDecimal totalExpectedRevenue,
            long pendingDraftsCount,
            long publishedCount
    ) {}

    public record BatchGenerateFailure(
            UUID leaseId,
            String unitNumber,
            String reason
    ) {}

    public record BatchGenerateResult(
            List<RentCycleResponse> succeeded,
            List<BatchGenerateFailure> failed
    ) {}

    public record BatchPublishFailure(
            UUID rentCycleId,
            String unitNumber,
            String reason
    ) {}

    public record BatchPublishResult(
            List<RentCycleResponse> succeeded,
            List<BatchPublishFailure> failed
    ) {}

    public record BatchUnpublishFailure(
            UUID rentCycleId,
            String unitNumber,
            String reason
    ) {}

    public record BatchUnpublishResult(
            List<RentCycleResponse> succeeded,
            List<BatchUnpublishFailure> failed
    ) {}

    public record RentCyclePropertyBillingMonthRequest(
            @NotNull UUID propertyId,
            @NotNull @Pattern(regexp = "\\d{4}-\\d{2}", message = "billingMonth must use yyyy-MM") String billingMonth
    ) {}
}
