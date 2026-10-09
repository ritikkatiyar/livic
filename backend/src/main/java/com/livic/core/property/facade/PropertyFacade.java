package com.livic.core.property.facade;

import com.livic.core.property.domain.PropertyType;
import com.livic.core.property.dto.PropertyOccupancySummaryDTO;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.dto.PublicPropertyListingDTO;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface PropertyFacade {

    Optional<PropertySummaryDTO> getPropertyById(UUID propertyId);

    Map<UUID, PropertySummaryDTO> getPropertiesByIds(Collection<UUID> propertyIds);

    Page<PropertySummaryDTO> getPropertiesByUserId(UUID userId, Pageable pageable);

    List<PropertySummaryDTO> getPropertiesByUserId(UUID userId);

    List<PropertySummaryDTO> getPropertiesByAutoBillDayOfMonth(int day);

    boolean existsPropertyById(UUID propertyId);

    // Analytics Read Methods
    List<PropertyOccupancySummaryDTO> getOccupancyByProperty(List<UUID> propertyIds);

    // Marketplace Read Methods (only publicly listed, active properties are exposed)
    Page<PublicPropertyListingDTO> searchPublicListings(String city, PropertyType type, Pageable pageable);

    Optional<PublicPropertyListingDTO> getPublicListing(UUID propertyId);

    /** Returns the property's QR slug, generating and persisting one first if it has none. Empty if the property does not exist. */
    Optional<String> getOrCreateQrSlug(UUID propertyId);

    // Feature modules a property has switched on. The module name belongs to the module that owns the
    // feature; property only stores the switch, and a missing row means off.
    boolean isModuleActive(UUID propertyId, String moduleName);

    Set<UUID> getPropertyIdsWithActiveModule(Collection<UUID> propertyIds, String moduleName);

    void setModuleActive(UUID propertyId, String moduleName, boolean active);
}
