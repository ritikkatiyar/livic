package com.livic.features.marketplace.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.livic.features.marketplace.dto.MarketplacePropertyDTOs;
import com.livic.features.marketplace.dto.MarketplaceUnitDTOs;
import com.livic.services.property.domain.PropertyTbl;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;
import java.util.List;

@Slf4j
public final class MarketplacePropertyMapper {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private MarketplacePropertyMapper() {}

    public static MarketplacePropertyDTOs.PropertySummaryResponse toSummaryResponse(
            PropertyTbl property,
            List<String> imageUrls,
            String startingPrice,
            int totalUnitsCount
    ) {
        if (property == null) {
            return null;
        }

        return new MarketplacePropertyDTOs.PropertySummaryResponse(
                property.getId(),
                property.getName(),
                property.getAddress(),
                property.getCity(),
                property.getLandmark(),
                property.getPropertyType(),
                property.getDescription(),
                property.getAmenities() != null ? List.copyOf(property.getAmenities()) : Collections.emptyList(),
                imageUrls != null ? imageUrls : Collections.emptyList(),
                startingPrice,
                totalUnitsCount
        );
    }

    public static MarketplacePropertyDTOs.PropertyDetailResponse toDetailResponse(
            PropertyTbl property,
            List<String> imageUrls,
            List<MarketplaceUnitDTOs.UnitSummaryResponse> units
    ) {
        if (property == null) {
            return null;
        }

        return new MarketplacePropertyDTOs.PropertyDetailResponse(
                property.getId(),
                property.getName(),
                property.getAddress(),
                property.getCity(),
                property.getLandmark(),
                property.getTotalFloors(),
                property.getPropertyType(),
                property.getDescription(),
                property.getAmenities() != null ? List.copyOf(property.getAmenities()) : Collections.emptyList(),
                imageUrls != null ? imageUrls : Collections.emptyList(),
                property.getQrSlug(),
                units != null ? units : Collections.emptyList()
        );
    }

    public static List<String> parseAmenities(String amenitiesJson) {
        if (amenitiesJson == null || amenitiesJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return OBJECT_MAPPER.readValue(amenitiesJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse amenities JSON: {}", amenitiesJson);
            return Collections.emptyList();
        }
    }
}
