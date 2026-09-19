package com.livic.verticals.marketplace.dto;

import com.livic.verticals.marketplace.dto.MarketplacePropertyDTOs.PropertySummaryResponse;
import com.livic.platform.common.domain.FacingDirection;
import com.livic.platform.common.domain.UnitType;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class MarketplaceUnitDTOs {

    public record UnitSummaryResponse(
        UUID id,
        UUID propertyId,
        String unitNumber,
        Integer floor,
        Integer capacity,
        UnitType type,
        FacingDirection facing,
        BigDecimal basePrice,
        boolean isBookable,
        String description,
        List<String> amenities,
        List<String> images
    ) {}

    public record UnitDetailCompositeResponse(
        PropertySummaryResponse property,
        UnitSummaryResponse unit
    ) {}
}
