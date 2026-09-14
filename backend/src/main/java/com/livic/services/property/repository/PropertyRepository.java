package com.livic.services.property.repository;

import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.domain.PropertyType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PropertyRepository extends JpaRepository<PropertyTbl, UUID> {
    List<PropertyTbl> findByAutoBillDayOfMonth(Integer autoBillDayOfMonth);

    List<PropertyTbl> findDistinctByIdIn(Collection<UUID> propertyIds);

    Page<PropertyTbl> findDistinctByIdIn(Collection<UUID> propertyIds, Pageable pageable);

    @Query("SELECT DISTINCT p FROM PropertyTbl p WHERE p.id IN :propertyIds AND (" +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.address) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.city) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "(p.landmark IS NOT NULL AND LOWER(p.landmark) LIKE LOWER(CONCAT('%', :search, '%'))))")
    Page<PropertyTbl> findDistinctByIdInAndSearch(
            @Param("propertyIds") Collection<UUID> propertyIds,
            @Param("search") String search,
            Pageable pageable);

    Page<PropertyTbl> findByIsPubliclyListedTrueAndIsActiveTrue(Pageable pageable);

    Page<PropertyTbl> findByIsPubliclyListedTrueAndIsActiveTrueAndCityContainingIgnoreCase(String city, Pageable pageable);

    @Query("SELECT p FROM PropertyTbl p WHERE p.isPubliclyListed = true AND p.isActive = true AND " +
           "(:city IS NULL OR LOWER(p.city) LIKE LOWER(CONCAT('%', :city, '%'))) AND " +
           "(:type IS NULL OR p.propertyType = :type)")
    Page<PropertyTbl> searchPublicProperties(
            @Param("city") String city,
            @Param("type") PropertyType type,
            Pageable pageable);

    Optional<PropertyTbl> findByQrSlug(String qrSlug);
}
