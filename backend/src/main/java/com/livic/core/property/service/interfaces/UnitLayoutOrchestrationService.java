package com.livic.core.property.service.interfaces;

import com.livic.core.property.dto.PropertyDTOs;
import com.livic.core.property.dto.UnitDTOs;

import java.util.List;
import java.util.UUID;

/**
 * Unit layouts enriched with occupancy and resident details, as the unit screens show them.
 */
public interface UnitLayoutOrchestrationService {
    List<UnitDTOs.UnitResponse> getFloorLayout(UUID propertyId, UUID blockId, int floorNumber);
    List<UnitDTOs.UnitResponse> getAllFloorsLayout(UUID propertyId);
    List<UnitDTOs.UnitResponse> getAllFloorsLayout(UUID propertyId, UUID blockId);
    List<UnitDTOs.UnitResponse> generateBatchUnits(UUID propertyId, PropertyDTOs.BatchUnitRequest request);
    List<UnitDTOs.UnitResponse> getVacatingUnits(UUID propertyId);
    List<UnitDTOs.UnitResponse> saveFloorLayout(UUID propertyId, UUID blockId, int floorNumber,
                                                List<UnitDTOs.FloorLayoutUnitRequest> items);
}
