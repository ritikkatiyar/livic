package com.livic.services.property.dto;

import com.livic.platform.common.domain.UnitType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class PropertyDTOs {

        public record CreatePropertyRequest(
                        @NotBlank(message = "Property name is required")
            String name,

                        @NotBlank(message = "Address is required")
            String address,

                        @NotBlank(message = "City is required")
            String city,

                        String landmark,

                        @NotNull(message = "Total floors is required") @Min(value = 1, message = "Property must have at least 1 floor")
            Integer totalFloors,

            java.util.List<String> amenities,

            Integer autoBillDayOfMonth
    ) {}

        public record UpdatePropertyRequest(
                        @NotBlank(message = "Property name is required")
            String name,

                        @NotBlank(message = "Address is required")
            String address,

                        @NotBlank(message = "City is required")
            String city,

                        String landmark,

                        @NotNull(message = "Total floors is required") @Min(value = 1, message = "Property must have at least 1 floor")
            Integer totalFloors,

            java.util.List<String> amenities,

            Integer autoBillDayOfMonth
    ) {}

        public record PropertyResponse(
            UUID id,
            String name,
            String address,
            String city,
            String landmark,
            Integer totalFloors,
            UUID ownerId,
            boolean isActive,
            java.util.List<String> amenities,
            Integer autoBillDayOfMonth
    ) {}

        public record BatchUnitRequest(
                        @Min(value = 1, message = "Must have at least 1 floor")
            int totalFloors,

                        @Min(value = 1, message = "Must have at least 1 Unit per floor")
            int unitsPerFloor,

                        int startingFloorNumber,

                        String prefix,

                        @Min(value = 1, message = "Must have at least 1 occupant capacity")
            int capacity,

                        @NotNull(message = "Unit type is required") UnitType unitType
    ) {}
}
