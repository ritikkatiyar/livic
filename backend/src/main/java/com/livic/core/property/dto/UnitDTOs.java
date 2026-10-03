package com.livic.core.property.dto;

import com.livic.core.property.domain.FacingDirection;
import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.domain.UnitType;
import com.livic.core.property.spi.MemberAgreementProvider;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
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
            List<Occupant> members
    ) {}

    /**
     * An active member of the unit, always someone with an account. {@code agreement} is what a
     * vertical holds them under, such as a lease in rental; owners and family usually have none.
     */
    public record Occupant(
            UUID memberId,
            UUID userId,
            String name,
            String phone,
            UnitMemberRole role,
            LocalDate fromDate,
            MemberAgreementProvider.MemberAgreement agreement
    ) {}
}
