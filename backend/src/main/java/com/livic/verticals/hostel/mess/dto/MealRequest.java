package com.livic.verticals.hostel.mess.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record MealRequest(
    @NotNull(message = "Meal slot is required") UUID slotId,
    @NotNull(message = "Items are required")
    @Size(max = 15, message = "At most 15 items per meal") List<@Valid @NotNull MenuItemRequest> items
) {}
