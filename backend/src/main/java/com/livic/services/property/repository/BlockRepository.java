package com.livic.services.property.repository;

import com.livic.services.property.domain.BlockTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BlockRepository extends JpaRepository<BlockTbl, UUID> {

    List<BlockTbl> findByPropertyIdOrderBySortOrderAsc(UUID propertyId);

    Optional<BlockTbl> findFirstByPropertyIdAndIsDefaultTrue(UUID propertyId);

    Optional<BlockTbl> findByPropertyIdAndNameIgnoreCase(UUID propertyId, String name);

    boolean existsByPropertyIdAndNameIgnoreCase(UUID propertyId, String name);

    void deleteByPropertyId(UUID propertyId);
}
