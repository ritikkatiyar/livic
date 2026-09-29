package com.livic.core.property.repository;

import com.livic.core.property.domain.PropertyModuleTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PropertyModuleRepository extends JpaRepository<PropertyModuleTbl, UUID> {

    @Query("SELECT m FROM PropertyModuleTbl m WHERE m.property.id = :propertyId AND m.moduleName = :moduleName")
    Optional<PropertyModuleTbl> findByPropertyIdAndModuleName(
            @Param("propertyId") UUID propertyId,
            @Param("moduleName") String moduleName);

    @Query("SELECT m.property.id FROM PropertyModuleTbl m "
            + "WHERE m.property.id IN :propertyIds AND m.moduleName = :moduleName AND m.isActive = true")
    List<UUID> findActivePropertyIds(
            @Param("propertyIds") Collection<UUID> propertyIds,
            @Param("moduleName") String moduleName);
}
