package com.livic.services.property.facade.impl;

import com.livic.services.property.dto.UnitSummaryDTO;
import com.livic.services.property.facade.UnitFacade;
import com.livic.services.property.service.interfaces.UnitCrudService;
import com.livic.services.property.service.interfaces.UnitQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UnitFacadeImpl implements UnitFacade {

    private final UnitQueryService unitQueryService;
    private final UnitCrudService unitCrudService;

    @Override
    public Optional<UnitSummaryDTO> getUnitById(UUID unitId) {
        return unitCrudService.findById(unitId)
                .map(UnitSummaryDTO::from);
    }

    @Override
    public List<UnitSummaryDTO> getUnitsByPropertyId(UUID propertyId) {
        return unitQueryService.getUnitsByProperty(propertyId).stream()
                .map(UnitSummaryDTO::from)
                .toList();
    }

    @Override
    public List<UnitSummaryDTO> getUnitsByPropertyIds(Collection<UUID> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return List.of();
        }
        return unitCrudService.findByPropertyIdIn(propertyIds).stream()
                .map(UnitSummaryDTO::from)
                .toList();
    }

    @Override
    public List<UnitSummaryDTO> getUnitsByFloor(UUID propertyId, int floorNumber) {
        return unitQueryService.getUnitsByFloor(propertyId, floorNumber).stream()
                .map(UnitSummaryDTO::from)
                .toList();
    }

    @Override
    public boolean existsUnitById(UUID unitId) {
        return unitCrudService.existsById(unitId);
    }

    @Override
    public long getTotalUnitsForPropertyIds(List<UUID> propertyIds) {
        return unitCrudService.countByPropertyIdIn(propertyIds);
    }

    @Override
    public Map<UUID, UnitSummaryDTO> getUnitsByIds(Collection<UUID> unitIds) {
        if (unitIds == null || unitIds.isEmpty()) {
            return Map.of();
        }
        return StreamSupport.stream(unitCrudService.findAllById(unitIds).spliterator(), false)
                .map(UnitSummaryDTO::from)
                .collect(Collectors.toMap(UnitSummaryDTO::id, dto -> dto));
    }

    @Override
    public List<UUID> getUnitIdsByUnitNumberSearch(String searchPattern) {
        return unitCrudService.findIdsByUnitNumberPattern(searchPattern);
    }
}
