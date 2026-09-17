package com.livic.services.property.facade.impl;

import com.livic.platform.common.domain.LeaseStatus;
import com.livic.platform.common.domain.PropertyType;
import com.livic.services.property.dto.PropertySummaryDTO;
import com.livic.services.property.dto.PublicPropertyListingDTO;
import com.livic.services.property.facade.PropertyFacade;
import com.livic.services.property.service.interfaces.PropertyCrudService;
import com.livic.services.property.service.interfaces.PropertyQueryService;
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
    private final PropertyCrudService propertyCrudService;

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

        String jpql = "SELECT p.id, p.name, " +
                      "(SELECT COUNT(u) FROM UnitTbl u WHERE u.property.id = p.id), " +
                      "(SELECT COUNT(l) FROM LeaseTbl l, UnitTbl u WHERE l.unitId = u.id AND u.property.id = p.id AND l.status = :statusActive) " +
                      "FROM PropertyTbl p WHERE p.id IN :propertyIds";

        Query query = entityManager.createQuery(jpql);
        query.setParameter("propertyIds", propertyIds);
        query.setParameter("statusActive", LeaseStatus.ACTIVE);

        List<Object[]> rows = query.getResultList();
        List<PropertyOccupancySummaryDTO> result = new ArrayList<>();
        for (Object[] row : rows) {
            UUID propId = (UUID) row[0];
            String propName = (String) row[1];
            int totalUnits = ((Number) row[2]).intValue();
            int occupiedUnits = ((Number) row[3]).intValue();

            result.add(new PropertyOccupancySummaryDTO(propId, propName, totalUnits, occupiedUnits));
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
