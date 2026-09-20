package com.livic.core.property.dto;

import com.livic.platform.common.domain.FacingDirection;
import com.livic.platform.common.domain.UnitType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class UnitDTOs {

        public record FloorSummaryResponse(
                        int floorNumber,

                        String displayLabel,

                        boolean configured,

                        long unitCount
    ) {}

        public record FloorLayoutUnitRequest(
                        @NotBlank(message = "Unit number is required")
            String unitNumber,

                        @NotNull(message = "gridX is required") @Min(value = 0, message = "gridX must be non-negative")
            Integer gridX,

                        @NotNull(message = "gridY is required") @Min(value = 0, message = "gridY must be non-negative")
            Integer gridY,

                        @Min(value = 1, message = "gridWidth must be at least 1")
            Integer gridWidth,

                        @Min(value = 1, message = "gridHeight must be at least 1")
            Integer gridHeight,

                        @NotNull(message = "Unit type is required") UnitType type,

                        @NotNull(message = "Capacity is required") @Min(value = 1, message = "Capacity must be at least 1")
            Integer capacity,

                        FacingDirection facing
    ) {}

        public record UnitResponse(
            UUID id,
            UUID blockId,
            String unitNumber,
            int floor,
            int gridX,
            int gridY,
            int gridWidth,
            int gridHeight,
            UnitType type,
            int capacity,
            FacingDirection facing,
            List<ActiveLeaseSummary> activeLeases
    ) {}

    public record ActiveLeaseSummary(
            UUID leaseId,
            UUID tenantUserId,
            String tenantName,
            String tenantPhone,
            java.math.BigDecimal rentAmount,
            String status
    ) {}
}
