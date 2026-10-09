package com.livic.verticals.hostel.mess.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.DayOfWeek;
import java.util.List;

public record DayMenuRequest(
    @NotNull(message = "Day of week is required") DayOfWeek dayOfWeek,
    @Size(max = 200, message = "A day's note must be at most 200 characters") String note,
    @NotNull(message = "Meals are required")
    @Size(max = 8, message = "At most 8 meals per day") List<@Valid @NotNull MealRequest> meals
) {}
