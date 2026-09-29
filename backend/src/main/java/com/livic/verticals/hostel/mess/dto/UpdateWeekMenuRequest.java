package com.livic.verticals.hostel.mess.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateWeekMenuRequest(
    /** Replaces the whole week; days left out have no items and no note. */
    @NotNull(message = "Days are required")
    @Size(max = 7, message = "A week has at most 7 days") List<@Valid @NotNull DayMenuRequest> days
) {}
