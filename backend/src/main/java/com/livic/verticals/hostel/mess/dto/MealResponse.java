package com.livic.verticals.hostel.mess.dto;

import java.util.List;
import java.util.UUID;

public record MealResponse(
    UUID slotId,
    List<MenuItemResponse> items
) {}
