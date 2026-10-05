package com.livic.verticals.rental.billing.dto;

import com.livic.core.finance.dto.BillDTOs;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Generating rent bills from leases: rental's half of billing. */
public class RentGenerationDTOs {

    public record GenerateBillRequest(
            @NotNull UUID leaseId,
            @NotNull @Pattern(regexp = "\\d{4}-\\d{2}", message = "billingMonth must use yyyy-MM") String billingMonth,
            @NotNull LocalDate dueDate
    ) {}

    /** {@code blockId} limits the batch to one block of the property. */
    public record BatchGenerateBillRequest(
            @NotNull UUID propertyId,
            UUID blockId,
            @NotNull @Pattern(regexp = "\\d{4}-\\d{2}", message = "billingMonth must use yyyy-MM") String billingMonth,
            @NotNull LocalDate dueDate
    ) {}

    public record BatchGenerateFailure(
            UUID leaseId,
            String unitNumber,
            String reason
    ) {}

    public record BatchGenerateResult(
            List<BillDTOs.BillResponse> succeeded,
            List<BatchGenerateFailure> failed
    ) {}
}
