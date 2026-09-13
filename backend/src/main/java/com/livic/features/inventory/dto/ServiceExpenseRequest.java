package com.livic.features.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ServiceExpenseRequest(
        @NotBlank(message = "Vendor name is required")
        String vendorName,

        @NotNull(message = "Service date is required")
        LocalDate serviceDate,

        @NotNull(message = "Amount is required")
        BigDecimal amount,

        @NotBlank(message = "Description is required")
        String description,

        LocalDate nextServiceDate
) {}
