package com.livic.core.property.service.interfaces;

import com.livic.core.property.dto.PropertyDTOs;
import java.util.UUID;

public interface PropertyService {
    PropertyDTOs.PropertyResponse createProperty(PropertyDTOs.CreatePropertyRequest request, UUID creatorId);
    PropertyDTOs.PropertyResponse updateProperty(UUID propertyId, PropertyDTOs.UpdatePropertyRequest request);
    void deleteProperty(UUID propertyId);
    PropertyDTOs.PropertyResponse togglePropertyActiveStatus(UUID propertyId, boolean active);
}
