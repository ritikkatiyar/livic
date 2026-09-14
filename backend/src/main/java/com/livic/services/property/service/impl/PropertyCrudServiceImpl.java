package com.livic.services.property.service.impl;

import com.livic.platform.common.domain.PropertyType;
import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.repository.PropertyRepository;
import com.livic.services.property.service.interfaces.PropertyCrudService;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Service
public class PropertyCrudServiceImpl extends AbstractCrudService<PropertyTbl, UUID, PropertyRepository> implements PropertyCrudService {

    public PropertyCrudServiceImpl(PropertyRepository repository) {
        super(repository);
    }

    @Override
    public List<PropertyTbl> findByAutoBillDayOfMonth(Integer autoBillDayOfMonth) {
        return repository.findByAutoBillDayOfMonth(autoBillDayOfMonth);
    }

    @Override
    public List<PropertyTbl> findDistinctByIdIn(Collection<UUID> propertyIds) {
        return repository.findDistinctByIdIn(propertyIds);
    }

    @Override
    public Page<PropertyTbl> findDistinctByIdIn(Collection<UUID> propertyIds, Pageable pageable) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return repository.findDistinctByIdIn(propertyIds, pageable);
    }

    @Override
    public Page<PropertyTbl> findDistinctByIdInAndSearch(Collection<UUID> propertyIds, String search, Pageable pageable) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return repository.findDistinctByIdInAndSearch(propertyIds, search, pageable);
    }

    @Override
    public Page<PropertyTbl> searchPublicProperties(String city, PropertyType type, Pageable pageable) {
        return repository.searchPublicProperties(city, type, pageable);
    }
}
