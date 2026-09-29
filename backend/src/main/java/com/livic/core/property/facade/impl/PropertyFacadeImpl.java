package com.livic.core.property.facade.impl;

import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.repository.UnitRepository;
import com.livic.core.property.repository.PropertyRepository;
import com.livic.core.property.domain.PropertyType;
import com.livic.core.property.dto.PropertyOccupancySummaryDTO;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.dto.PublicPropertyListingDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.property.domain.UnitTbl;
import com.livic.core.property.domain.UnitOccupancy;
import com.livic.core.property.spi.UnitOccupancyProvider;
import java.util.Map;
import com.livic.core.property.service.interfaces.BlockService;
import com.livic.core.property.service.interfaces.PropertyQueryService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("unchecked")
public class PropertyFacadeImpl implements PropertyFacade {

    @PersistenceContext
    private EntityManager entityManager;

    private final PropertyQueryService propertyQueryService;
    private final UnitRepository unitRepository;
    private final UnitOccupancyProvider unitOccupancyProvider;
    private final BlockService blockService;
    private final PropertyRepository propertyRepository;

    @Override
    public Optional<PropertySummaryDTO> getPropertyById(UUID propertyId) {
        try {
            return Optional.ofNullable(PropertySummaryDTO.from(propertyQueryService.getPropertyById(propertyId)));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    @Override
    public Map<UUID, PropertySummaryDTO> getPropertiesByIds(Collection<UUID> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return propertyQueryService.getPropertiesByIds(propertyIds).stream()
                .map(PropertySummaryDTO::from)
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(PropertySummaryDTO::id, p -> p, (a, b) -> a));
    }

    @Override
    public Page<PropertySummaryDTO> getPropertiesByUserId(UUID userId, Pageable pageable) {
        return propertyQueryService.getPropertiesByUserId(userId, pageable)
                .map(PropertySummaryDTO::from);
    }

    @Override
    public List<PropertySummaryDTO> getPropertiesByUserId(UUID userId) {
        return propertyQueryService.getPropertiesByUserId(userId).stream()
                .map(PropertySummaryDTO::from)
                .toList();
    }

    @Override
    public List<PropertySummaryDTO> getPropertiesByAutoBillDayOfMonth(int day) {
        return propertyQueryService.getPropertiesByAutoBillDayOfMonth(day).stream()
                .map(PropertySummaryDTO::from)
                .toList();
    }

    @Override
    public boolean existsPropertyById(UUID propertyId) {
        return propertyQueryService.existsById(propertyId);
    }

    @Override
    public List<PropertyOccupancySummaryDTO> getOccupancyByProperty(List<UUID> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return Collections.emptyList();
        }

        // This used to run JPQL over LeaseTbl from here, which is core reading a vertical's
        // table. The entity name was a string, so no architecture test could see it. Occupancy
        // now comes through the SPI that rental implements for exactly this.
        List<UnitTbl> units = unitRepository.findByPropertyIdIn(propertyIds);
        Map<UUID, List<UnitOccupancyProvider.UnitOccupant>> occupantsByUnit =
                unitOccupancyProvider.activeOccupantsByUnitIds(units.stream().map(UnitTbl::getId).toList());

        Map<UUID, List<UnitTbl>> unitsByProperty = units.stream()
                .filter(u -> u.getProperty() != null)
                .collect(Collectors.groupingBy(u -> u.getProperty().getId()));

        Map<UUID, String> namesById = propertyQueryService.getPropertiesByIds(propertyIds).stream()
                .collect(Collectors.toMap(PropertyTbl::getId, PropertyTbl::getName, (a, b) -> a));

        List<PropertyOccupancySummaryDTO> result = new ArrayList<>();
        for (UUID propertyId : propertyIds) {
            // Counting per unit rather than per occupant keeps a shared room with two tenants
            // at one occupied unit, while beds still count both.
            OccupancyTally tally = new OccupancyTally();
            for (UnitTbl unit : unitsByProperty.getOrDefault(propertyId, List.of())) {
                tally.add(occupantsByUnit.getOrDefault(unit.getId(), List.of()).size(), unit.getCapacity());
            }
            result.add(tally.toSummary(propertyId, namesById.get(propertyId)));
        }
        return result;
    }

    @Override
    public Page<PublicPropertyListingDTO> searchPublicListings(String city, PropertyType type, Pageable pageable) {
        return propertyRepository.searchPublicProperties(city, type, pageable)
                .map(p -> PublicPropertyListingDTO.from(p, blockService.totalFloorsForProperty(p.getId())));
    }

    @Override
    public Optional<PublicPropertyListingDTO> getPublicListing(UUID propertyId) {
        return propertyRepository.findById(propertyId)
                .filter(p -> p.isPubliclyListed() && p.isActive())
                .map(p -> PublicPropertyListingDTO.from(p, blockService.totalFloorsForProperty(p.getId())));
    }

    @Override
    @Transactional
    public Optional<String> getOrCreateQrSlug(UUID propertyId) {
        return propertyRepository.findById(propertyId).map(property -> {
            if (property.getQrSlug() == null || property.getQrSlug().isBlank()) {
                property.setQrSlug("qr_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
                propertyRepository.save(property);
            }
            return property.getQrSlug();
        });
    }
/** Folds each unit's occupant count and bed capacity into one property's occupancy. */
    private static final class OccupancyTally {
        private final int[] unitStates = new int[UnitOccupancy.values().length];
        private int totalBeds;
        private int occupiedBeds;
        private int activeLeases;

        void add(int unitActiveLeases, Integer capacity) {
            int beds = UnitOccupancy.beds(capacity);
            unitStates[UnitOccupancy.of(unitActiveLeases, capacity).ordinal()]++;
            totalBeds += beds;
            occupiedBeds += Math.min(unitActiveLeases, beds);
            activeLeases += unitActiveLeases;
        }

        PropertyOccupancySummaryDTO toSummary(UUID propertyId, String propertyName) {
            return new PropertyOccupancySummaryDTO(propertyId, propertyName,
                    unitStates[UnitOccupancy.VACANT.ordinal()],
                    unitStates[UnitOccupancy.PARTIAL.ordinal()],
                    unitStates[UnitOccupancy.FULL.ordinal()],
                    totalBeds, occupiedBeds, activeLeases);
        }
    }
}
