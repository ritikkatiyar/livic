package com.livic.verticals.hostel.mess.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateMealSlotsRequest(
    /** The full list in display order; saved slots left out are deleted along with their menu items. */
    @NotNull(message = "Meal slots are required")
    @Size(max = 8, message = "At most 8 meal slots") List<@Valid @NotNull MealSlotRequest> slots
) {}
