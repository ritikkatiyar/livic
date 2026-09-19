package com.livic.core.community.announcement.repository;

import com.livic.core.community.announcement.domain.AnnouncementTargetType;
import com.livic.core.community.announcement.domain.AnnouncementTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AnnouncementRepository extends JpaRepository<AnnouncementTbl, UUID> {

    @Query("SELECT a FROM AnnouncementTbl a WHERE a.propertyId = :propertyId AND " +
           "(a.targetType = :propType OR " +
           "(a.targetType = :floorType AND a.targetFloorNumber = :floor) OR " +
           "(a.targetType = :unitType AND a.targetUnitId = :unitId))")
    Page<AnnouncementTbl> findNoticesForTenant(
            @Param("propertyId") UUID propertyId,
            @Param("floor") Integer floor,
            @Param("unitId") UUID unitId,
            @Param("propType") AnnouncementTargetType propType,
            @Param("floorType") AnnouncementTargetType floorType,
            @Param("unitType") AnnouncementTargetType unitType,
            Pageable pageable
    );

    Page<AnnouncementTbl> findByPropertyId(UUID propertyId, Pageable pageable);
}
