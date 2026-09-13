package com.livic.services.property.mapper;

import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.dto.PropertyDTOs;

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
                .totalFloors(request.totalFloors())
                .amenities(am)
                .autoBillDayOfMonth(request.autoBillDayOfMonth())
                .build();
    }

    public static void updateEntity(PropertyDTOs.UpdatePropertyRequest request, PropertyTbl property) {
        property.setName(request.name());
        property.setAddress(request.address());
        property.setCity(request.city());
        property.setLandmark(request.landmark());
        property.setTotalFloors(request.totalFloors());
        if (request.autoBillDayOfMonth() != null) {
            property.setAutoBillDayOfMonth(request.autoBillDayOfMonth());
        }
        if (request.amenities() != null) {
            property.getAmenities().clear();
            property.getAmenities().addAll(request.amenities());
        }
    }

    public static PropertyDTOs.PropertyResponse toResponse(PropertyTbl property) {
        if (property == null) {
            return null;
        }
        return new PropertyDTOs.PropertyResponse(
                property.getId(),
                property.getName(),
                property.getAddress(),
                property.getCity(),
                property.getLandmark(),
                property.getTotalFloors(),
                null,
                property.isActive(),
                property.getAmenities() != null ? property.getAmenities() : List.of(),
                property.getAutoBillDayOfMonth()
        );
    }
}
