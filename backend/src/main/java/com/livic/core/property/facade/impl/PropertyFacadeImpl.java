package com.livic.core.property.facade.impl;

import com.livic.verticals.rental.lease.domain.LeaseStatus;
import com.livic.core.property.domain.PropertyType;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.dto.PublicPropertyListingDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.property.service.interfaces.PropertyCrudService;
import com.livic.core.property.domain.UnitTbl;
import com.livic.core.property.service.interfaces.UnitCrudService;
import com.livic.core.property.spi.UnitOccupancyProvider;
import java.util.Map;
import com.livic.core.property.service.interfaces.PropertyQueryService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
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
    private final UnitCrudService unitCrudService;
    private final UnitOccupancyProvider unitOccupancyProvider;
    private final com.livic.core.property.service.interfaces.BlockService blockService;
    private final PropertyCrudService propertyCrudService;

    @Override
    public Optional<PropertySummaryDTO> getPropertyById(UUID propertyId) {
        try {
            return Optional.ofNullable(PropertySummaryDTO.from(propertyQueryService.getPropertyById(propertyId), blockService.totalFloorsForProperty(propertyId)));
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
                .map(p -> PropertySummaryDTO.from(p, blockService.totalFloorsForProperty(p.getId())))
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(PropertySummaryDTO::id, p -> p, (a, b) -> a));
    }

    @Override
    public Page<PropertySummaryDTO> getPropertiesByUserId(UUID userId, Pageable pageable) {
        return propertyQueryService.getPropertiesByUserId(userId, pageable)
                .map(p -> PropertySummaryDTO.from(p, blockService.totalFloorsForProperty(p.getId())));
    }

    @Override
    public List<PropertySummaryDTO> getPropertiesByUserId(UUID userId) {
        return propertyQueryService.getPropertiesByUserId(userId).stream()
                .map(p -> PropertySummaryDTO.from(p, blockService.totalFloorsForProperty(p.getId())))
                .toList();
    }

    @Override
    public List<PropertySummaryDTO> getPropertiesByAutoBillDayOfMonth(int day) {
        return propertyQueryService.getPropertiesByAutoBillDayOfMonth(day).stream()
                .map(p -> PropertySummaryDTO.from(p, blockService.totalFloorsForProperty(p.getId())))
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
        List<UnitTbl> units = unitCrudService.findByPropertyIdIn(propertyIds);
        Map<UUID, List<UnitOccupancyProvider.UnitOccupant>> occupantsByUnit =
                unitOccupancyProvider.activeOccupantsByUnitIds(units.stream().map(UnitTbl::getId).toList());

        Map<UUID, List<UnitTbl>> unitsByProperty = units.stream()
                .filter(u -> u.getProperty() != null)
                .collect(Collectors.groupingBy(u -> u.getProperty().getId()));

        List<PropertyOccupancySummaryDTO> result = new ArrayList<>();
        for (UUID propertyId : propertyIds) {
            List<UnitTbl> propertyUnits = unitsByProperty.getOrDefault(propertyId, List.of());
            long occupied = propertyUnits.stream()
                    .filter(u -> !occupantsByUnit.getOrDefault(u.getId(), List.of()).isEmpty())
                    .count();
            String name = propertyUnits.isEmpty()
                    ? propertyQueryService.getPropertyById(propertyId).getName()
                    : propertyUnits.get(0).getProperty().getName();
            result.add(new PropertyOccupancySummaryDTO(propertyId, name, propertyUnits.size(), (int) occupied));
        }
        return result;
    }

    @Override
    public Page<PublicPropertyListingDTO> searchPublicListings(String city, PropertyType type, Pageable pageable) {
        return propertyCrudService.searchPublicProperties(city, type, pageable)
                .map(PublicPropertyListingDTO::from);
    }

    @Override
    public Optional<PublicPropertyListingDTO> getPublicListing(UUID propertyId) {
        return propertyCrudService.findById(propertyId)
                .filter(p -> p.isPubliclyListed() && p.isActive())
                .map(PublicPropertyListingDTO::from);
    }

    @Override
    @Transactional
    public Optional<String> getOrCreateQrSlug(UUID propertyId) {
        return propertyCrudService.findById(propertyId).map(property -> {
            if (property.getQrSlug() == null || property.getQrSlug().isBlank()) {
                property.setQrSlug("qr_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
                propertyCrudService.save(property);
            }
            return property.getQrSlug();
        });
    }
}
