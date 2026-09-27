package com.livic.core.property.service.interfaces;

import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.dto.PropertyDTOs;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PropertyQueryService {
    Page<PropertyTbl> getPropertiesByUserId(UUID userId, Pageable pageable);
    List<PropertyTbl> getPropertiesByUserId(UUID userId);
    List<PropertyTbl> getPropertiesByIds(Collection<UUID> propertyIds);
    PropertyTbl getPropertyById(UUID propertyId);
    PropertyDTOs.PropertyResponse getProperty(UUID propertyId);
    Page<PropertyDTOs.PropertyResponse> getMyProperties(UUID userId, String search, Pageable pageable);
    boolean existsById(UUID propertyId);
    List<PropertyTbl> getPropertiesByAutoBillDayOfMonth(int day);
}
