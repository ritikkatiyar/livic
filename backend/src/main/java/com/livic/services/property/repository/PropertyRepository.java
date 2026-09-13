package com.livic.services.property.repository;

import com.livic.services.property.domain.PropertyTbl;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
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
}
