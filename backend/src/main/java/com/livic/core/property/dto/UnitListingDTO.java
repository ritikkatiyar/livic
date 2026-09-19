package com.livic.core.property.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.livic.platform.common.domain.FacingDirection;
import com.livic.platform.common.domain.UnitType;
import com.livic.core.property.domain.UnitTbl;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Public-facing view of a unit, including the pricing and booking fields shown on the marketplace.
 */
public record UnitListingDTO(
        UUID id,
        UUID propertyId,
        String unitNumber,
        Integer floor,
        Integer capacity,
        UnitType type,
        FacingDirection facing,
        BigDecimal basePrice,
        boolean bookable,
        String description,
        List<String> amenities
) {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public static UnitListingDTO from(UnitTbl u) {
        if (u == null) {
            return null;
        }
        return new UnitListingDTO(
                u.getId(),
                u.getProperty() != null ? u.getProperty().getId() : null,
                u.getUnitNumber(),
                u.getFloor(),
                u.getCapacity(),
                u.getType(),
                u.getFacing(),
                u.getBasePrice(),
                u.isBookable(),
                u.getDescription(),
                AmenitiesJson.parse(u.getAmenities())
        );
    }

    @Slf4j
    private static final class AmenitiesJson {
        static List<String> parse(String json) {
            if (json == null || json.isBlank()) {
                return List.of();
            }
            try {
                return OBJECT_MAPPER.readValue(json, new TypeReference<List<String>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse unit amenities JSON: {}", json);
                return List.of();
            }
        }
    }
}
