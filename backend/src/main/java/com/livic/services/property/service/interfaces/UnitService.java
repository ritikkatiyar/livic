package com.livic.services.property.service.interfaces;

import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.domain.UnitTbl;
import com.livic.services.property.dto.PropertyDTOs;
import com.livic.services.property.dto.UnitDTOs;

import java.util.List;
import java.util.UUID;

public interface UnitService {
    List<UnitTbl> saveAll(List<UnitTbl> units);
    List<UnitTbl> saveFloorLayout(UUID propertyId, int floorNumber, List<UnitDTOs.FloorLayoutUnitRequest> items);
    List<UnitTbl> generateBatchUnits(UUID propertyId, PropertyDTOs.BatchUnitRequest request);
}
