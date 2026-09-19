package com.livic.core.property.facade;

import com.livic.platform.common.domain.PropertyType;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.dto.PublicPropertyListingDTO;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface PropertyFacade {

    Optional<PropertySummaryDTO> getPropertyById(UUID propertyId);

    Map<UUID, PropertySummaryDTO> getPropertiesByIds(Collection<UUID> propertyIds);

    Page<PropertySummaryDTO> getPropertiesByUserId(UUID userId, Pageable pageable);

    List<PropertySummaryDTO> getPropertiesByUserId(UUID userId);

    List<PropertySummaryDTO> getPropertiesByAutoBillDayOfMonth(int day);

    boolean existsPropertyById(UUID propertyId);

    // Analytics Read Methods
    record PropertyOccupancySummaryDTO(UUID propertyId, String propertyName, int totalUnits, int occupiedUnits) {}

    List<PropertyOccupancySummaryDTO> getOccupancyByProperty(List<UUID> propertyIds);

    // Marketplace Read Methods (only publicly listed, active properties are exposed)
    Page<PublicPropertyListingDTO> searchPublicListings(String city, PropertyType type, Pageable pageable);

    Optional<PublicPropertyListingDTO> getPublicListing(UUID propertyId);

    /** Returns the property's QR slug, generating and persisting one first if it has none. Empty if the property does not exist. */
    Optional<String> getOrCreateQrSlug(UUID propertyId);
}
