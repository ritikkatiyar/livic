package com.livic.services.property.service.interfaces;

import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.dto.PropertyDTOs;
import java.util.UUID;

public interface PropertyService {
    PropertyTbl createProperty(PropertyDTOs.CreatePropertyRequest request, UUID creatorId);
    PropertyTbl updateProperty(UUID propertyId, PropertyDTOs.UpdatePropertyRequest request);
    void deleteProperty(UUID propertyId);
    PropertyTbl togglePropertyActiveStatus(UUID propertyId, boolean active);
}
