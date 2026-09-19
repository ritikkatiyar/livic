package com.livic.services.property.service.interfaces;

import com.livic.services.property.domain.BlockTbl;
import com.livic.services.property.domain.PropertyTbl;

import java.util.List;
import java.util.UUID;

/**
 * Blocks (towers or wings) inside a property. Rental and residential properties keep a single
 * default block the apps never show; societies name theirs.
 */
public interface BlockService {

    /** The property's default block, created on first use so older properties keep working. */
    BlockTbl getOrCreateDefaultBlock(PropertyTbl property);

    List<BlockTbl> findByPropertyId(UUID propertyId);

    /** Removes a property's blocks; units must already be gone. */
    void deleteByPropertyId(UUID propertyId);
}
