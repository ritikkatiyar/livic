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
    /**
     * Per-property occupancy, counted per unit: a shared room with two tenants is one occupied unit (and two
     * occupied beds), so {@code occupiedUnits <= totalUnits} and {@code occupiedBeds <= totalBeds} always hold.
     * {@code activeLeases} is the raw tenant count and can exceed {@code occupiedBeds} only for an overbooked unit.
     */
    record PropertyOccupancySummaryDTO(UUID propertyId, String propertyName,
                                       int vacantUnits, int partialUnits, int fullUnits,
                                       int totalBeds, int occupiedBeds, int activeLeases) {

        public int totalUnits() {
            return vacantUnits + partialUnits + fullUnits;
        }

        /** Units with at least one active lease. */
        public int occupiedUnits() {
            return partialUnits + fullUnits;
        }
    }

    /** Unit occupancy state from its active lease count and bed capacity (a missing capacity means 1). */
    enum UnitOccupancy {
        VACANT, PARTIAL, FULL;

        public static UnitOccupancy of(long activeLeases, Integer capacity) {
            int beds = beds(capacity);
            if (activeLeases <= 0) return VACANT;
            return activeLeases < beds ? PARTIAL : FULL;
        }

        public static int beds(Integer capacity) {
            return capacity == null || capacity < 1 ? 1 : capacity;
        }
    }

    List<PropertyOccupancySummaryDTO> getOccupancyByProperty(List<UUID> propertyIds);

    // Marketplace Read Methods (only publicly listed, active properties are exposed)
    Page<PublicPropertyListingDTO> searchPublicListings(String city, PropertyType type, Pageable pageable);

    Optional<PublicPropertyListingDTO> getPublicListing(UUID propertyId);

    /** Returns the property's QR slug, generating and persisting one first if it has none. Empty if the property does not exist. */
    Optional<String> getOrCreateQrSlug(UUID propertyId);
}
