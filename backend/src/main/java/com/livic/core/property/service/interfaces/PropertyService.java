package com.livic.core.property.service.interfaces;

import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.dto.PropertyDTOs;
import java.util.UUID;

public interface PropertyService {
    PropertyTbl createProperty(PropertyDTOs.CreatePropertyRequest request, UUID creatorId);
    PropertyTbl updateProperty(UUID propertyId, PropertyDTOs.UpdatePropertyRequest request);
    void deleteProperty(UUID propertyId);
    PropertyTbl togglePropertyActiveStatus(UUID propertyId, boolean active);
}
