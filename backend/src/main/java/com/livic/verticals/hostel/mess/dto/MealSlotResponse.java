package com.livic.verticals.hostel.mess.dto;

import java.time.LocalTime;
import java.util.UUID;

public record MealSlotResponse(
    UUID id,
    String name,
    /** Both times are set or both are null. */
    LocalTime startTime,
    LocalTime endTime
) {}
