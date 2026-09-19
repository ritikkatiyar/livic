package com.livic.verticals.rental.inventory.dto;

import com.livic.verticals.rental.inventory.domain.enums.DeductionApprovalStatus;
import com.livic.verticals.rental.inventory.domain.enums.InventoryCondition;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ReturnVerificationRequest(
        @NotNull(message = "Condition at return is required")
        InventoryCondition conditionAtReturn,

        String returnNotes,
        BigDecimal damageDeductionAmount,
        DeductionApprovalStatus deductionApprovalStatus,
        List<UUID> mediaAssetIds
) {}
