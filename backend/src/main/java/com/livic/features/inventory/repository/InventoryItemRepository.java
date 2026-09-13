package com.livic.features.inventory.repository;

import com.livic.features.inventory.domain.InventoryItemTbl;
import com.livic.features.inventory.domain.enums.InventoryScope;
import com.livic.features.inventory.domain.enums.InventoryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItemTbl, UUID>, JpaSpecificationExecutor<InventoryItemTbl> {

    List<InventoryItemTbl> findAllByPropertyId(UUID propertyId);

    Page<InventoryItemTbl> findAllByPropertyId(UUID propertyId, Pageable pageable);

    List<InventoryItemTbl> findAllByIdIn(Collection<UUID> ids);

    List<InventoryItemTbl> findAllByPropertyIdAndScope(UUID propertyId, InventoryScope scope);

    List<InventoryItemTbl> findAllByPropertyIdAndUnitId(UUID propertyId, UUID unitId);

    List<InventoryItemTbl> findAllByPropertyIdAndStatus(UUID propertyId, InventoryStatus status);

    @Query("SELECT COALESCE(SUM(i.replacementValue), 0) FROM InventoryItemTbl i WHERE i.propertyId = :propertyId")
    BigDecimal sumReplacementValueByPropertyId(@Param("propertyId") UUID propertyId);

    long countByPropertyId(UUID propertyId);

    long countByPropertyIdAndStatus(UUID propertyId, InventoryStatus status);
}
