package com.livic.features.marketplace.mapper;

import com.livic.features.marketplace.dto.MarketplacePropertyDTOs.PropertySummaryResponse;
import com.livic.features.marketplace.dto.MarketplaceUnitDTOs.UnitDetailCompositeResponse;
import com.livic.features.marketplace.dto.MarketplaceUnitDTOs.UnitSummaryResponse;
import com.livic.services.property.dto.UnitListingDTO;

import java.util.Collections;
import java.util.List;

public final class MarketplaceUnitMapper {

    private MarketplaceUnitMapper() {}

    public static UnitSummaryResponse toResponse(UnitListingDTO unit, List<String> imageUrls) {
        if (unit == null) {
            return null;
        }

        return new UnitSummaryResponse(
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

    public static UnitDetailCompositeResponse toCompositeResponse(
            PropertySummaryResponse propertySummary,
            UnitSummaryResponse unitSummary
    ) {
        return new UnitDetailCompositeResponse(propertySummary, unitSummary);
    }
}
