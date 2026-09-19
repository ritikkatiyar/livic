package com.livic.core.property.dto;

import com.livic.platform.common.domain.PropertyType;
import com.livic.core.property.domain.PropertyTbl;

import java.util.List;
import java.util.UUID;

/**
 * Public-facing view of a property that is listed on the marketplace.
 */
public record PublicPropertyListingDTO(
        UUID id,
        String name,
        String address,
        String city,
        String landmark,
        Integer totalFloors,
        PropertyType propertyType,
        String description,
        List<String> amenities,
        String qrSlug
) {
    public static PublicPropertyListingDTO from(PropertyTbl p) {
        if (p == null) {
            return null;
        }
        return new PublicPropertyListingDTO(
                p.getId(),
                p.getName(),
                p.getAddress(),
                p.getCity(),
                p.getLandmark(),
                p.getTotalFloors(),
                p.getPropertyType(),
                p.getDescription(),
                p.getAmenities() != null ? List.copyOf(p.getAmenities()) : List.of(),
                p.getQrSlug()
        );
    }
}
