package com.livic.features.marketplace.mapper;

import com.livic.features.marketplace.dto.MarketplacePropertyDTOs.PropertyDetailResponse;
import com.livic.features.marketplace.dto.MarketplacePropertyDTOs.PropertySummaryResponse;
import com.livic.services.property.dto.PublicPropertyListingDTO;

import java.util.Collections;
import java.util.List;

public final class MarketplacePropertyMapper {

    private MarketplacePropertyMapper() {}

    public static PropertySummaryResponse toSummaryResponse(
            PublicPropertyListingDTO property,
            List<String> imageUrls,
            String startingPrice,
            int totalUnitsCount
    ) {
        if (property == null) {
            return null;
        }

        return new PropertySummaryResponse(
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

    public static PropertyDetailResponse toDetailResponse(
            PublicPropertyListingDTO property,
            List<String> imageUrls,
            String startingPrice,
            int totalUnitsCount,
            int availableUnitsCount
    ) {
        if (property == null) {
            return null;
        }

        return new PropertyDetailResponse(
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
