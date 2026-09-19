package com.livic.core.property.facade;

import com.livic.core.property.dto.UnitListingDTO;
import com.livic.core.property.dto.UnitSummaryDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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

    // Marketplace Read Methods
    Optional<UnitListingDTO> getUnitListingById(UUID unitId);

    List<UnitListingDTO> getUnitListingsByPropertyId(UUID propertyId);

    Page<UnitListingDTO> getUnitListingsByPropertyId(UUID propertyId, boolean availableOnly, Pageable pageable);

    Map<UUID, List<UnitListingDTO>> getUnitListingsByPropertyIds(Collection<UUID> propertyIds);
}
