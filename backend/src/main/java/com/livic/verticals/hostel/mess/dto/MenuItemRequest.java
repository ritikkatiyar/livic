package com.livic.verticals.hostel.mess.dto;

import com.livic.verticals.hostel.mess.domain.DietType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MenuItemRequest(
    @NotBlank(message = "Dish name is required")
    @Size(max = 80, message = "Dish name must be at most 80 characters") String name,
    /** Optional; leave empty to show the dish without a mark. */
    DietType dietType
) {}
