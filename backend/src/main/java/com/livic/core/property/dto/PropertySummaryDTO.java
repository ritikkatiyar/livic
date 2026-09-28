package com.livic.core.property.dto;

import com.livic.core.property.domain.PropertyTbl;

import java.util.UUID;

/**
 * A property as other modules see it.
 *
 * <p>There is no floor count here on purpose. Floors belong to a block, and two buildings on
 * one plot can differ in height, so no single number is honest. Management clients read
 * {@code /properties/{id}/blocks}, which gives them the count per building.
 */
public record PropertySummaryDTO(
        UUID id,
        String name,
        String address,
        String city,
        String landmark,
        boolean active,
        Integer autoBillDayOfMonth
) {
    public PropertySummaryDTO(UUID id, String name, String address, String city, String landmark, boolean active) {
        this(id, name, address, city, landmark, active, null);
    }

    public static PropertySummaryDTO from(PropertyTbl p) {
        if (p == null) {
            return null;
        }
        return new PropertySummaryDTO(
                p.getId(),
                p.getName(),
                p.getAddress(),
                p.getCity(),
                p.getLandmark(),
                p.isActive(),
                p.getAutoBillDayOfMonth()
        );
    }
}
