package com.livic.services.property.service.interfaces;

import com.livic.services.property.domain.PropertyTbl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PropertyQueryService {
    Page<PropertyTbl> getPropertiesByUserId(UUID userId, Pageable pageable);
    Page<PropertyTbl> getPropertiesByUserId(UUID userId, String search, Pageable pageable);
    List<PropertyTbl> getPropertiesByUserId(UUID userId);
    List<PropertyTbl> getPropertiesByIds(Collection<UUID> propertyIds);
    PropertyTbl getPropertyById(UUID propertyId);
    boolean existsById(UUID propertyId);
    List<PropertyTbl> getPropertiesByAutoBillDayOfMonth(int day);
}
