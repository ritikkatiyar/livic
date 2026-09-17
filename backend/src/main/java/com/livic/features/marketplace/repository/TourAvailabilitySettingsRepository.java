package com.livic.features.marketplace.repository;

import com.livic.features.marketplace.domain.TourAvailabilitySettingsTbl;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TourAvailabilitySettingsRepository extends JpaRepository<TourAvailabilitySettingsTbl, UUID> {

    Optional<TourAvailabilitySettingsTbl> findByPropertyId(UUID propertyId);

    /**
     * Locks the settings row so concurrent tour requests for a capacity-limited slot are counted one at a time.
     * Properties without settings have no capacity limit, so there is nothing to lock.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM TourAvailabilitySettingsTbl s WHERE s.propertyId = :propertyId")
    Optional<TourAvailabilitySettingsTbl> findByPropertyIdForUpdate(@Param("propertyId") UUID propertyId);
}
