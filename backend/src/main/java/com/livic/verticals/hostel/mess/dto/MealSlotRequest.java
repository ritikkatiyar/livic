package com.livic.verticals.hostel.mess.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;
import java.util.UUID;

public record MealSlotRequest(
    /** Null for a new slot. */
    UUID id,
    @NotBlank(message = "Meal name is required")
    @Size(max = 40, message = "Meal name must be at most 40 characters") String name,
    /** Leave both times empty when the meal has no set time. */
    LocalTime startTime,
    LocalTime endTime
) {}
