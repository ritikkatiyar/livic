package com.livic.core.property.service.interfaces;

import com.livic.platform.common.service.interfaces.CrudService;
import com.livic.core.property.domain.UnitTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface UnitCrudService extends CrudService<UnitTbl, UUID> {
    List<UnitTbl> findByPropertyId(UUID propertyId);
    List<UnitTbl> findByPropertyIdIn(Collection<UUID> propertyIds);
    boolean existsByPropertyIdAndUnitNumber(UUID propertyId, String unitNumber);
    List<UnitTbl> findByPropertyIdAndFloor(UUID propertyId, Integer floor);
    int findMaxFloorByPropertyId(UUID propertyId);
    long countByPropertyIdIn(List<UUID> propertyIds);
    void deleteByPropertyId(UUID propertyId);
    List<UUID> findIdsByUnitNumberPattern(String pattern);
    Page<UnitTbl> findListingUnits(UUID propertyId, boolean availableOnly, Pageable pageable);
}
