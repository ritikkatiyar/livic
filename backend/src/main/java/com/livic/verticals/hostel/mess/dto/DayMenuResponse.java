package com.livic.verticals.hostel.mess.dto;

import java.time.DayOfWeek;
import java.util.List;

public record DayMenuResponse(
    DayOfWeek dayOfWeek,
    String note,
    /** One entry per meal slot, in slot order; a meal with no items is empty. */
    List<MealResponse> meals
) {}
