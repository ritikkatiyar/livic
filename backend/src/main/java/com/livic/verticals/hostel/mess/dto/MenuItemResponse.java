package com.livic.verticals.hostel.mess.dto;

import com.livic.verticals.hostel.mess.domain.DietType;

import java.util.UUID;

public record MenuItemResponse(
    UUID id,
    String name,
    /** Null when the dish is not marked. */
    DietType dietType
) {}
