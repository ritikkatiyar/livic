package com.livic.core.property.service.impl;

import com.livic.core.property.domain.BlockTbl;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.repository.BlockRepository;
import com.livic.core.property.service.interfaces.BlockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class BlockServiceImpl implements BlockService {

    private final BlockRepository blockRepository;

    @Override
    public BlockTbl getOrCreateDefaultBlock(PropertyTbl property) {
        return blockRepository.findFirstByPropertyIdAndIsDefaultTrue(property.getId())
                .orElseGet(() -> blockRepository.save(BlockTbl.builder()
                        .property(property)
                        .name(BlockTbl.DEFAULT_NAME)
                        .sortOrder(0)
                        .isDefault(true)
                        .build()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BlockTbl> findByPropertyId(UUID propertyId) {
        return blockRepository.findByPropertyIdOrderBySortOrderAsc(propertyId);
    }

    @Override
    public void deleteByPropertyId(UUID propertyId) {
        blockRepository.deleteByPropertyId(propertyId);
    }
}
