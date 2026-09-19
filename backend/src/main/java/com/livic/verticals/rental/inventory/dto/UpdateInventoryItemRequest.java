package com.livic.verticals.rental.inventory.dto;

import com.livic.verticals.rental.inventory.domain.enums.InventoryCategory;
import com.livic.verticals.rental.inventory.domain.enums.InventoryCondition;
import com.livic.verticals.rental.inventory.domain.enums.InventoryScope;
import com.livic.verticals.rental.inventory.domain.enums.InventoryStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateInventoryItemRequest(
        UUID unitId,

        @NotBlank(message = "Item name is required")
        String name,

        @NotNull(message = "Category is required")
        InventoryCategory category,

        String serialNumber,
        String modelNumber,

        @NotNull(message = "Scope is required")
        InventoryScope scope,

        @NotNull(message = "Condition is required")
        InventoryCondition currentCondition,

        @NotNull(message = "Status is required")
        InventoryStatus status,

        LocalDate purchaseDate,
        LocalDate warrantyExpiresAt,
        LocalDate nextServiceDate,

        @NotNull(message = "Replacement value is required")
        BigDecimal replacementValue,

        String notes
) {}
