package com.livic.features.inventory.dto;

import com.livic.features.inventory.domain.enums.InventoryCategory;
import com.livic.features.inventory.domain.enums.InventoryCondition;
import com.livic.features.inventory.domain.enums.InventoryScope;
import com.livic.features.inventory.domain.enums.InventoryStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateInventoryItemRequest(
        @NotNull(message = "Property ID is required")
        UUID propertyId,

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
