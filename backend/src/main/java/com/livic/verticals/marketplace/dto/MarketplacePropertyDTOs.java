package com.livic.verticals.marketplace.dto;

import com.livic.platform.common.domain.PropertyType;

import java.util.List;
import java.util.UUID;

public class MarketplacePropertyDTOs {

    public record PropertySummaryResponse(
        UUID id,
        String name,
        String address,
        String city,
        String landmark,
        PropertyType propertyType,
        String description,
        List<String> amenities,
        List<String> images,
        String startingPrice,
        Integer totalUnitsCount
    ) {}

    public record PropertyDetailResponse(
        UUID id,
        String name,
        String address,
        String city,
        String landmark,
        Integer totalFloors,
        PropertyType propertyType,
        String description,
        List<String> amenities,
        List<String> images,
        String qrSlug,
        String startingPrice,
        int totalUnitsCount,
        int availableUnitsCount
    ) {}
}
