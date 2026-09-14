package com.livic.features.marketplace.mapper;

import com.livic.features.marketplace.dto.MarketplacePropertyDTOs;
import com.livic.features.marketplace.dto.MarketplaceUnitDTOs;
import com.livic.services.property.domain.UnitTbl;

import java.util.Collections;
import java.util.List;

public final class MarketplaceUnitMapper {

    private MarketplaceUnitMapper() {}

    public static MarketplaceUnitDTOs.UnitSummaryResponse toResponse(UnitTbl unit, List<String> imageUrls) {
        if (unit == null) {
            return null;
        }

        return new MarketplaceUnitDTOs.UnitSummaryResponse(
                unit.getId(),
                unit.getProperty() != null ? unit.getProperty().getId() : null,
                unit.getUnitNumber(),
                unit.getFloor(),
                unit.getCapacity(),
                unit.getType(),
                unit.getFacing(),
                unit.getBasePrice(),
                unit.isBookable(),
                unit.getDescription(),
                MarketplacePropertyMapper.parseAmenities(unit.getAmenities()),
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
