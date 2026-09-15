package com.livic.features.marketplace.repository;

import com.livic.features.marketplace.domain.TourAvailabilityWindowTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TourAvailabilityWindowRepository extends JpaRepository<TourAvailabilityWindowTbl, UUID> {

    List<TourAvailabilityWindowTbl> findByPropertyIdOrderByDayOfWeekAscStartTimeAsc(UUID propertyId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM TourAvailabilityWindowTbl w WHERE w.propertyId = :propertyId")
    int deleteByPropertyId(@Param("propertyId") UUID propertyId);
}
