package com.livic.core.property.service.impl;

import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.core.property.domain.PropertyJoinCodeTbl;
import com.livic.core.property.repository.PropertyJoinCodeRepository;
import com.livic.core.property.service.interfaces.PropertyJoinCodeCrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PropertyJoinCodeCrudServiceImpl extends AbstractCrudService<PropertyJoinCodeTbl, UUID, PropertyJoinCodeRepository> implements PropertyJoinCodeCrudService {

    public PropertyJoinCodeCrudServiceImpl(PropertyJoinCodeRepository repository) {
        super(repository);
    }

    @Override
    public Optional<PropertyJoinCodeTbl> findByCode(String code) {
        return repository.findByCode(code);
    }

    @Override
    public List<PropertyJoinCodeTbl> findByPropertyId(UUID propertyId) {
        return repository.findByPropertyId(propertyId);
    }

    @Override
    public Page<PropertyJoinCodeTbl> findByPropertyId(UUID propertyId, Pageable pageable) {
        return repository.findByPropertyId(propertyId, pageable);
    }
}
