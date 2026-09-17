package com.livic.services.property.repository;

import com.livic.services.property.domain.UnitTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface UnitRepository extends JpaRepository<UnitTbl, UUID> {
    List<UnitTbl> findByPropertyId(UUID propertyId);

    List<UnitTbl> findByPropertyIdIn(Collection<UUID> propertyIds);

    boolean existsByPropertyIdAndUnitNumber(UUID propertyId, String unitNumber);

    List<UnitTbl> findByPropertyIdAndFloor(UUID propertyId, Integer floor);

    @Query("SELECT COALESCE(MAX(u.floor), 0) FROM UnitTbl u WHERE u.property.id = :propertyId")
    int findMaxFloorByPropertyId(@Param("propertyId") UUID propertyId);

    @Query("SELECT COUNT(u) FROM UnitTbl u WHERE u.property.id IN :propertyIds")
    long countByPropertyIdIn(@Param("propertyIds") List<UUID> propertyIds);

    void deleteByPropertyId(UUID propertyId);

    @Query("SELECT u.id FROM UnitTbl u WHERE LOWER(u.unitNumber) LIKE LOWER(CONCAT('%', :pattern, '%'))")
    List<UUID> findIdsByUnitNumberPattern(@Param("pattern") String pattern);

    /** Marketplace listing order: bookable units first, then floor and numeric-aware unit number. */
    @Query(value = "SELECT u FROM UnitTbl u WHERE u.property.id = :propertyId AND (:availableOnly = false OR u.isBookable = true) " +
                   "ORDER BY u.isBookable DESC, u.floor ASC, LENGTH(u.unitNumber) ASC, u.unitNumber ASC",
           countQuery = "SELECT COUNT(u) FROM UnitTbl u WHERE u.property.id = :propertyId AND (:availableOnly = false OR u.isBookable = true)")
    Page<UnitTbl> findListingUnits(@Param("propertyId") UUID propertyId, @Param("availableOnly") boolean availableOnly, Pageable pageable);
}
