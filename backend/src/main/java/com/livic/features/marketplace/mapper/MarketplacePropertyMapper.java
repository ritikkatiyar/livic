package com.livic.features.marketplace.mapper;

import com.livic.features.marketplace.dto.MarketplacePropertyDTOs;
import com.livic.services.property.dto.PublicPropertyListingDTO;

import java.util.Collections;
import java.util.List;

public final class MarketplacePropertyMapper {

    private MarketplacePropertyMapper() {}

    public static MarketplacePropertyDTOs.PropertySummaryResponse toSummaryResponse(
            PublicPropertyListingDTO property,
            List<String> imageUrls,
            String startingPrice,
            int totalUnitsCount
    ) {
        if (property == null) {
            return null;
        }

        return new MarketplacePropertyDTOs.PropertySummaryResponse(
                property.id(),
                property.name(),
                property.address(),
                property.city(),
                property.landmark(),
                property.propertyType(),
                property.description(),
                amenitiesOf(property),
                imageUrls != null ? imageUrls : Collections.emptyList(),
                startingPrice,
                totalUnitsCount
        );
    }

    public static MarketplacePropertyDTOs.PropertyDetailResponse toDetailResponse(
            PublicPropertyListingDTO property,
            List<String> imageUrls,
            String startingPrice,
            int totalUnitsCount,
            int availableUnitsCount
    ) {
        if (property == null) {
            return null;
        }

        return new MarketplacePropertyDTOs.PropertyDetailResponse(
                property.id(),
                property.name(),
                property.address(),
                property.city(),
                property.landmark(),
                property.totalFloors(),
                property.propertyType(),
                property.description(),
                amenitiesOf(property),
                imageUrls != null ? imageUrls : Collections.emptyList(),
                property.qrSlug(),
                startingPrice,
                totalUnitsCount,
                availableUnitsCount
        );
    }

    private static List<String> amenitiesOf(PublicPropertyListingDTO property) {
        return property.amenities() != null ? property.amenities() : Collections.emptyList();
    }
}
