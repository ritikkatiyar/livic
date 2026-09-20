package com.livic.core.finance.dto;

import com.livic.platform.common.domain.RentChargeType;
import com.livic.core.finance.domain.BillStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class BillDTOs {

    public record GenerateBillRequest(
            @NotNull UUID leaseId,
            @NotNull @Pattern(regexp = "\\d{4}-\\d{2}", message = "billingMonth must use yyyy-MM") String billingMonth,
            @NotNull LocalDate dueDate
    ) {}

    public record BatchGenerateBillRequest(
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

    public record BillResponse(
            UUID id,
            UUID leaseId,
            String tenantName,
            String unitNumber,
            String billingMonth,
            BigDecimal totalAmount,
            LocalDate dueDate,
            BillStatus status,
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

    public record BillListResponse(
            List<BillResponse> content,
            long totalElements,
            int totalPages,
            int size,
            int number,
            RentRollMetricsDTO metrics
    ) {}

    public record BatchGenerateFailure(
            UUID leaseId,
            String unitNumber,
            String reason
    ) {}

    public record BatchGenerateResult(
            List<BillResponse> succeeded,
            List<BatchGenerateFailure> failed
    ) {}

    public record BatchPublishFailure(
            UUID billId,
            String unitNumber,
            String reason
    ) {}

    public record BatchPublishResult(
            List<BillResponse> succeeded,
            List<BatchPublishFailure> failed
    ) {}

    public record BatchUnpublishFailure(
            UUID billId,
            String unitNumber,
            String reason
    ) {}

    public record BatchUnpublishResult(
            List<BillResponse> succeeded,
            List<BatchUnpublishFailure> failed
    ) {}

    public record BillPropertyBillingMonthRequest(
            @NotNull UUID propertyId,
            @NotNull @Pattern(regexp = "\\d{4}-\\d{2}", message = "billingMonth must use yyyy-MM") String billingMonth
    ) {}
}
