package com.livic.services.property.facade;

import com.livic.services.property.dto.UnitSummaryDTO;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface UnitFacade {

    Optional<UnitSummaryDTO> getUnitById(UUID unitId);

    List<UnitSummaryDTO> getUnitsByPropertyId(UUID propertyId);

    List<UnitSummaryDTO> getUnitsByPropertyIds(Collection<UUID> propertyIds);

    List<UnitSummaryDTO> getUnitsByFloor(UUID propertyId, int floorNumber);

    boolean existsUnitById(UUID unitId);

    long getTotalUnitsForPropertyIds(List<UUID> propertyIds);

    Map<UUID, UnitSummaryDTO> getUnitsByIds(Collection<UUID> unitIds);

    List<UUID> getUnitIdsByUnitNumberSearch(String searchPattern);
}
