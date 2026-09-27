package com.livic.core.property.facade.impl;

import com.livic.core.property.repository.UnitRepository;
import com.livic.core.property.dto.UnitListingDTO;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.UnitFacade;
import com.livic.core.property.service.interfaces.UnitQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    private final UnitRepository unitRepository;

    @Override
    public Optional<UnitSummaryDTO> getUnitById(UUID unitId) {
        return unitRepository.findById(unitId)
                .map(UnitSummaryDTO::from);
    }

    @Override
    public List<UnitSummaryDTO> getUnitsByPropertyId(UUID propertyId) {
        return unitQueryService.getUnitsByProperty(propertyId).stream()
                .map(UnitSummaryDTO::from)
                .toList();
    }

    @Override
    public List<UnitSummaryDTO> getUnitsByPropertyIdAndBlockId(UUID propertyId, UUID blockId) {
        if (blockId == null) {
            return getUnitsByPropertyId(propertyId);
        }
        return unitQueryService.getUnitsByProperty(propertyId, blockId).stream()
                .map(UnitSummaryDTO::from)
                .toList();
    }

    @Override
    public List<UnitSummaryDTO> getUnitsByPropertyIds(Collection<UUID> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return List.of();
        }
        return unitRepository.findByPropertyIdIn(propertyIds).stream()
                .map(UnitSummaryDTO::from)
                .toList();
    }

    @Override
    public List<UnitSummaryDTO> getUnitsByFloor(UUID propertyId, int floorNumber) {
        return unitQueryService.getUnitsByFloor(propertyId, null, floorNumber).stream()
                .map(UnitSummaryDTO::from)
                .toList();
    }


    @Override
    public long getTotalUnitsForPropertyIds(List<UUID> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return 0;
        }
        return unitRepository.countByPropertyIdIn(propertyIds);
    }

    @Override
    public Map<UUID, UnitSummaryDTO> getUnitsByIds(Collection<UUID> unitIds) {
        if (unitIds == null || unitIds.isEmpty()) {
            return Map.of();
        }
        return StreamSupport.stream(unitRepository.findAllById(unitIds).spliterator(), false)
                .map(UnitSummaryDTO::from)
                .collect(Collectors.toMap(UnitSummaryDTO::id, dto -> dto));
    }

    @Override
    public List<UUID> getUnitIdsByUnitNumberSearch(String searchPattern) {
        if (searchPattern == null || searchPattern.isBlank()) {
            return List.of();
        }
        return unitRepository.findIdsByUnitNumberPattern(searchPattern.trim());
    }

    @Override
    public Optional<UnitListingDTO> getUnitListingById(UUID unitId) {
        return unitRepository.findById(unitId)
                .map(UnitListingDTO::from);
    }

    @Override
    public List<UnitListingDTO> getUnitListingsByPropertyId(UUID propertyId) {
        return unitRepository.findByPropertyId(propertyId).stream()
                .map(UnitListingDTO::from)
                .toList();
    }

    @Override
    public Page<UnitListingDTO> getUnitListingsByPropertyId(UUID propertyId, boolean availableOnly, Pageable pageable) {
        return unitRepository.findListingUnits(propertyId, availableOnly, pageable)
                .map(UnitListingDTO::from);
    }

    @Override
    public Map<UUID, List<UnitListingDTO>> getUnitListingsByPropertyIds(Collection<UUID> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return Map.of();
        }
        return unitRepository.findByPropertyIdIn(propertyIds).stream()
                .map(UnitListingDTO::from)
                .collect(Collectors.groupingBy(UnitListingDTO::propertyId));
    }
}
