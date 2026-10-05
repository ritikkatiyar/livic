package com.livic.core.finance.dto;

import com.livic.core.finance.domain.BillStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class BillDTOs {

    public record RecordCashPaymentRequest(
            @NotNull BigDecimal amount,
            String note,
            UUID payerUserId
    ) {}

    /** {@code activePayers} counts people who pay, so compare it with {@code totalBeds}: a shared room holds several. */
    public record PreFlightChecklistResponse(
            int totalUnits,
            int totalBeds,
            int activePayers,
            int meterReadingsExpected,
            int meterReadingsEntered,
            boolean isReady
    ) {}

    public record BillResponse(
            UUID id,
            UUID blockId,
            String blockName,
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
    ) {
        public BillResponse(
                UUID id,
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
        ) {
            this(id, null, null, tenantName, unitNumber, billingMonth, totalAmount, dueDate, status, paidAt, createdAt, updatedAt, charges);
        }
    }

    public record ChargeResponse(
            UUID id,
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
            BillMetricsDTO metrics
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
