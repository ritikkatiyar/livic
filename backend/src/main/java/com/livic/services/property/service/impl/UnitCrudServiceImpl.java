package com.livic.services.property.service.impl;

import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.services.property.domain.UnitTbl;
import com.livic.services.property.repository.UnitRepository;
import com.livic.services.property.service.interfaces.UnitCrudService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class UnitCrudServiceImpl extends AbstractCrudService<UnitTbl, UUID, UnitRepository> implements UnitCrudService {

    public UnitCrudServiceImpl(UnitRepository unitRepository) {
        super(unitRepository);
    }

    @Override
    public List<UnitTbl> findByPropertyId(UUID propertyId) {
        return repository.findByPropertyId(propertyId);
    }

    @Override
    public List<UnitTbl> findByPropertyIdIn(Collection<UUID> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return List.of();
        }
        return repository.findByPropertyIdIn(propertyIds);
    }

    @Override
    public boolean existsByPropertyIdAndUnitNumber(UUID propertyId, String unitNumber) {
        return repository.existsByPropertyIdAndUnitNumber(propertyId, unitNumber);
    }

    @Override
    public List<UnitTbl> findByPropertyIdAndFloor(UUID propertyId, Integer floor) {
        return repository.findByPropertyIdAndFloor(propertyId, floor);
    }

    @Override
    public int findMaxFloorByPropertyId(UUID propertyId) {
        return repository.findMaxFloorByPropertyId(propertyId);
    }

    @Override
    public long countByPropertyIdIn(List<UUID> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return 0;
        }
        return repository.countByPropertyIdIn(propertyIds);
    }

    @Override
    public void deleteByPropertyId(UUID propertyId) {
        repository.deleteByPropertyId(propertyId);
    }

    @Override
    public List<UUID> findIdsByUnitNumberPattern(String pattern) {
        if (pattern == null || pattern.trim().isEmpty()) {
            return List.of();
        }
        return repository.findIdsByUnitNumberPattern(pattern.trim());
    }
}
