package com.livic.services.property.service.interfaces;

import com.livic.platform.common.domain.PropertyType;
import com.livic.platform.common.service.interfaces.CrudService;
import com.livic.services.property.domain.PropertyTbl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PropertyCrudService extends CrudService<PropertyTbl, UUID> {
    List<PropertyTbl> findByAutoBillDayOfMonth(Integer autoBillDayOfMonth);
    List<PropertyTbl> findDistinctByIdIn(Collection<UUID> propertyIds);
    Page<PropertyTbl> findDistinctByIdIn(Collection<UUID> propertyIds, Pageable pageable);
    Page<PropertyTbl> findDistinctByIdInAndSearch(Collection<UUID> propertyIds, String search, Pageable pageable);
    Page<PropertyTbl> searchPublicProperties(String city, PropertyType type, Pageable pageable);
}
