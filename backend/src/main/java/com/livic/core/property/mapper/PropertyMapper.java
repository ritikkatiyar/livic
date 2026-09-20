package com.livic.core.property.mapper;

import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.dto.PropertyDTOs;

import java.util.ArrayList;
import java.util.List;

public final class PropertyMapper {

    private PropertyMapper() {
    }

    public static PropertyTbl toEntity(PropertyDTOs.CreatePropertyRequest request) {
        List<String> am = request.amenities() != null ? new ArrayList<>(request.amenities()) : new ArrayList<>();
        return PropertyTbl.builder()
                .name(request.name())
                .address(request.address())
                .city(request.city())
                .landmark(request.landmark())
                .amenities(am)
                .autoBillDayOfMonth(request.autoBillDayOfMonth())
                .build();
    }

    public static void updateEntity(PropertyDTOs.UpdatePropertyRequest request, PropertyTbl property) {
        property.setName(request.name());
        property.setAddress(request.address());
        property.setCity(request.city());
        property.setLandmark(request.landmark());
        if (request.autoBillDayOfMonth() != null) {
            property.setAutoBillDayOfMonth(request.autoBillDayOfMonth());
        }
        if (request.amenities() != null) {
            property.getAmenities().clear();
            property.getAmenities().addAll(request.amenities());
        }
    }

    public static PropertyDTOs.PropertyResponse toResponse(PropertyTbl property) {
        return toResponse(property, null);
    }

    /**
     * {@code totalFloors} is derived from the property's blocks, not stored on the property:
     * two towers on one plot can differ in height. Clients that have not learned about blocks
     * still get the tallest one here.
     */
    public static PropertyDTOs.PropertyResponse toResponse(PropertyTbl property, Integer totalFloors) {
        if (property == null) {
            return null;
        }
        return new PropertyDTOs.PropertyResponse(
                property.getId(),
                property.getName(),
                property.getAddress(),
                property.getCity(),
                property.getLandmark(),
                totalFloors,
                null,
                property.isActive(),
                property.getAmenities() != null ? property.getAmenities() : List.of(),
                property.getAutoBillDayOfMonth()
        );
    }
}
