package com.livic.core.property.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/** Blocks as clients see them. */
public class BlockDTOs {

    public record BlockResponse(
            UUID id,
            UUID propertyId,
            String name,
            Integer sortOrder,
            boolean isDefault,
            Integer totalFloors,
            long unitCount
    ) {
    }

    public record CreateBlockRequest(
            @NotBlank(message = "Block name is required")
            @Size(max = 100, message = "Block name must be at most 100 characters")
            String name,

            @Min(value = 1, message = "A block must have at least one floor")
            Integer totalFloors,

            Integer sortOrder
    ) {
    }

    public record UpdateBlockRequest(
            @NotBlank(message = "Block name is required")
            @Size(max = 100, message = "Block name must be at most 100 characters")
            String name,

            @Min(value = 1, message = "A block must have at least one floor")
            Integer totalFloors,

            Integer sortOrder
    ) {
    }
}
