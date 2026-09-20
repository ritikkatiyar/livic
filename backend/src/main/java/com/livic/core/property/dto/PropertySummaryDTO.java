package com.livic.core.property.dto;

import com.livic.core.property.domain.PropertyTbl;

import java.util.UUID;

public record PropertySummaryDTO(
        UUID id,
        String name,
        String address,
        String city,
        String landmark,
        Integer totalFloors,
        boolean active,
        Integer autoBillDayOfMonth
) {
    public PropertySummaryDTO(UUID id, String name, String address, String city, String landmark, Integer totalFloors, boolean active) {
        this(id, name, address, city, landmark, totalFloors, active, null);
    }

    public static PropertySummaryDTO from(PropertyTbl p) {
        return from(p, null);
    }

    /** {@code totalFloors} is derived from the property's blocks, so callers supply it. */
    public static PropertySummaryDTO from(PropertyTbl p, Integer totalFloors) {
        if (p == null) {
            return null;
        }
        return new PropertySummaryDTO(
                p.getId(),
                p.getName(),
                p.getAddress(),
                p.getCity(),
                p.getLandmark(),
                totalFloors,
                p.isActive(),
                p.getAutoBillDayOfMonth()
        );
    }
}
