package com.livic.core.property.service.interfaces;

import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.domain.UnitTbl;
import com.livic.core.property.dto.PropertyDTOs;
import com.livic.core.property.dto.UnitDTOs;

import java.util.List;
import java.util.UUID;

public interface UnitService {
    List<UnitTbl> saveAll(List<UnitTbl> units);
    List<UnitTbl> saveFloorLayout(UUID propertyId, int floorNumber, List<UnitDTOs.FloorLayoutUnitRequest> items);
    List<UnitTbl> generateBatchUnits(UUID propertyId, PropertyDTOs.BatchUnitRequest request);
}
