package com.livic.verticals.hostel.mess.dto;

import java.util.List;
import java.util.UUID;

public record MessMenuResponse(
    UUID propertyId,
    /** Whether residents can see the menu. */
    boolean enabled,
    /** The property's meal slots, in display order. */
    List<MealSlotResponse> slots,
    /** All seven days, Monday first. */
    List<DayMenuResponse> days
) {}
