package com.livic.core.property.facade.impl;

import com.livic.platform.common.domain.LeaseStatus;
import com.livic.platform.common.domain.PropertyType;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.dto.PublicPropertyListingDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.property.facade.PropertyFacade.UnitOccupancy;
import com.livic.core.property.service.interfaces.PropertyCrudService;
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

        Query propertyQuery = entityManager.createQuery(
                "SELECT p.id, p.name FROM PropertyTbl p WHERE p.id IN :propertyIds");
        propertyQuery.setParameter("propertyIds", propertyIds);

        Map<UUID, OccupancyTally> tallies = tallyUnitsByProperty(propertyIds);

        List<PropertyOccupancySummaryDTO> result = new ArrayList<>();
        for (Object[] row : (List<Object[]>) propertyQuery.getResultList()) {
            UUID propId = (UUID) row[0];
            result.add(tallies.getOrDefault(propId, new OccupancyTally()).toSummary(propId, (String) row[1]));
        }
        return result;
    }

    /**
     * One row per unit (property, capacity, active leases), folded per property. Counting per unit rather than
     * per lease keeps a shared room with two tenants at one occupied unit.
     */
    private Map<UUID, OccupancyTally> tallyUnitsByProperty(List<UUID> propertyIds) {
        Query query = entityManager.createQuery(
                "SELECT u.property.id, u.capacity, " +
                "(SELECT COUNT(l) FROM LeaseTbl l WHERE l.unitId = u.id AND l.status = :statusActive) " +
                "FROM UnitTbl u WHERE u.property.id IN :propertyIds");
        query.setParameter("propertyIds", propertyIds);
        query.setParameter("statusActive", LeaseStatus.ACTIVE);

        Map<UUID, OccupancyTally> tallies = new HashMap<>();
        for (Object[] row : (List<Object[]>) query.getResultList()) {
            tallies.computeIfAbsent((UUID) row[0], id -> new OccupancyTally())
                    .add(((Number) row[2]).intValue(), (Integer) row[1]);
        }
        return tallies;
    }

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
