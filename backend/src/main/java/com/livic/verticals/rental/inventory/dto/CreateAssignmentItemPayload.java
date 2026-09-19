package com.livic.verticals.rental.inventory.dto;

import com.livic.verticals.rental.inventory.domain.enums.InventoryCondition;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CreateAssignmentItemPayload(
        @NotNull(message = "Item ID is required")
        UUID itemId,

        @NotNull(message = "Condition at assignment is required")
        InventoryCondition conditionAtAssignment,

        String assignmentNotes,
        List<UUID> mediaAssetIds
) {}
