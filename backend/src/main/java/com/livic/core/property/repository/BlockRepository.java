package com.livic.core.property.repository;

import com.livic.core.property.domain.BlockTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BlockRepository extends JpaRepository<BlockTbl, UUID> {

    /**
     * Name breaks the tie: nothing writes a non-zero sort_order yet, so ordering by it alone
     * is not deterministic once a property has more than one block.
     */
    List<BlockTbl> findByPropertyIdOrderBySortOrderAscNameAsc(UUID propertyId);

    long countByPropertyId(UUID propertyId);

    Optional<BlockTbl> findFirstByPropertyIdAndIsDefaultTrue(UUID propertyId);

    Optional<BlockTbl> findByPropertyIdAndNameIgnoreCase(UUID propertyId, String name);

    boolean existsByPropertyIdAndNameIgnoreCase(UUID propertyId, String name);

    void deleteByPropertyId(UUID propertyId);
}
