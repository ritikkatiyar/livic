package com.livic.core.property.service.interfaces;

import com.livic.core.property.domain.BlockTbl;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.dto.BlockDTOs;

import java.util.List;
import java.util.UUID;

/**
 * Blocks — the buildings, towers or wings inside one property.
 *
 * <p>Every property has at least one, created automatically and named "Main", so a landlord
 * with a single building never meets the concept. Any property type may have several: two
 * buildings on one plot share their staff, charge configs and books, and splitting them into
 * separate properties would split all three.
 */
public interface BlockService {

    /** The property's default block, created on first use so older properties keep working. */
    BlockTbl getOrCreateDefaultBlock(PropertyTbl property);

    List<BlockTbl> findByPropertyId(UUID propertyId);

    List<BlockDTOs.BlockResponse> listBlocks(UUID propertyId);

    BlockTbl getById(UUID blockId);

    /**
     * The block to act on when a caller named none — the default one. It is what keeps the
     * single-block properties working while clients learn about blocks.
     */
    BlockTbl resolveBlock(UUID propertyId, UUID blockId);

    BlockDTOs.BlockResponse create(UUID propertyId, BlockDTOs.CreateBlockRequest request);

    BlockDTOs.BlockResponse update(UUID propertyId, UUID blockId, BlockDTOs.UpdateBlockRequest request);

    /** Refuses while the block still holds units, and refuses to leave a property with none. */
    void delete(UUID propertyId, UUID blockId);

    /** Removes a property's blocks; units must already be gone. */
    void deleteByPropertyId(UUID propertyId);

    /** Total floors across a property's blocks, for the property API's derived value. */
    Integer totalFloorsForProperty(UUID propertyId);
}
