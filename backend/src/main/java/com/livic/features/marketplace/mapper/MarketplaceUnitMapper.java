package com.livic.features.marketplace.mapper;

import com.livic.features.marketplace.dto.MarketplacePropertyDTOs;
import com.livic.features.marketplace.dto.MarketplaceUnitDTOs;
import com.livic.services.property.dto.UnitListingDTO;

import java.util.Collections;
import java.util.List;

public final class MarketplaceUnitMapper {

    private MarketplaceUnitMapper() {}

    public static MarketplaceUnitDTOs.UnitSummaryResponse toResponse(UnitListingDTO unit, List<String> imageUrls) {
        if (unit == null) {
            return null;
        }

        return new MarketplaceUnitDTOs.UnitSummaryResponse(
                unit.id(),
                unit.propertyId(),
                unit.unitNumber(),
                unit.floor(),
                unit.capacity(),
                unit.type(),
                unit.facing(),
                unit.basePrice(),
                unit.bookable(),
                unit.description(),
                unit.amenities() != null ? unit.amenities() : Collections.emptyList(),
                imageUrls != null ? imageUrls : Collections.emptyList()
        );
    }

    public static MarketplaceUnitDTOs.UnitDetailCompositeResponse toCompositeResponse(
            MarketplacePropertyDTOs.PropertySummaryResponse propertySummary,
            MarketplaceUnitDTOs.UnitSummaryResponse unitSummary
    ) {
        return new MarketplaceUnitDTOs.UnitDetailCompositeResponse(propertySummary, unitSummary);
    }
}
