package com.livic.core.property.service.impl;

import com.livic.core.property.domain.BlockTbl;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.dto.BlockDTOs;
import com.livic.core.property.repository.BlockRepository;
import com.livic.core.property.repository.UnitRepository;
import com.livic.core.property.service.interfaces.BlockService;
import com.livic.core.property.service.interfaces.PropertyQueryService;
import com.livic.platform.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class BlockServiceImpl implements BlockService {

    private final BlockRepository blockRepository;
    private final UnitRepository unitRepository;
    private final PropertyQueryService propertyQueryService;

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
        return blockRepository.findByPropertyIdOrderBySortOrderAscNameAsc(propertyId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BlockDTOs.BlockResponse> listBlocks(UUID propertyId) {
        return findByPropertyId(propertyId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BlockTbl getById(UUID blockId) {
        return blockRepository.findById(blockId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Block not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public BlockTbl resolveBlock(UUID propertyId, UUID blockId) {
        if (blockId == null) {
            // Creates the default block if the property predates blocks, which is what keeps
            // properties made outside the service working.
            return getOrCreateDefaultBlock(propertyQueryService.getPropertyById(propertyId));
        }
        BlockTbl block = getById(blockId);
        if (!block.getProperty().getId().equals(propertyId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Block does not belong to this property");
        }
        return block;
    }

    @Override
    public BlockDTOs.BlockResponse create(UUID propertyId, BlockDTOs.CreateBlockRequest request) {
        PropertyTbl property = propertyQueryService.getPropertyById(propertyId);
        String name = request.name().trim();
        if (blockRepository.existsByPropertyIdAndNameIgnoreCase(propertyId, name)) {
            throw new BusinessException(HttpStatus.CONFLICT, "A block named \"" + name + "\" already exists here");
        }
        // The first block a property ever gets is its default, so single-building properties
        // keep hiding the concept; the second one is what makes blocks visible.
        boolean first = blockRepository.countByPropertyId(propertyId) == 0;
        BlockTbl block = blockRepository.save(BlockTbl.builder()
                .property(property)
                .name(name)
                .sortOrder(request.sortOrder() != null ? request.sortOrder() : 0)
                .isDefault(first)
                .totalFloors(request.totalFloors())
                .build());
        return toResponse(block);
    }

    @Override
    public BlockDTOs.BlockResponse update(UUID propertyId, UUID blockId, BlockDTOs.UpdateBlockRequest request) {
        BlockTbl block = resolveBlock(propertyId, blockId);
        String name = request.name().trim();
        if (!block.getName().equalsIgnoreCase(name)
                && blockRepository.existsByPropertyIdAndNameIgnoreCase(propertyId, name)) {
            throw new BusinessException(HttpStatus.CONFLICT, "A block named \"" + name + "\" already exists here");
        }
        block.setName(name);
        if (request.totalFloors() != null) {
            int highestUsed = unitRepository.findMaxFloorByBlockId(block.getId());
            if (request.totalFloors() < highestUsed) {
                throw new BusinessException(HttpStatus.CONFLICT,
                        "This block already has units on floor " + highestUsed);
            }
            block.setTotalFloors(request.totalFloors());
        }
        if (request.sortOrder() != null) {
            block.setSortOrder(request.sortOrder());
        }
        return toResponse(blockRepository.save(block));
    }

    @Override
    public void delete(UUID propertyId, UUID blockId) {
        BlockTbl block = resolveBlock(propertyId, blockId);
        if (unitRepository.countByBlockId(block.getId()) > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "Move or remove this block's units first");
        }
        if (blockRepository.countByPropertyId(propertyId) <= 1) {
            throw new BusinessException(HttpStatus.CONFLICT, "A property must keep at least one block");
        }
        blockRepository.delete(block);
    }

    @Override
    public void deleteByPropertyId(UUID propertyId) {
        blockRepository.deleteByPropertyId(propertyId);
    }

    @Override
    @Transactional(readOnly = true)
    public Integer totalFloorsForProperty(UUID propertyId) {
        // The tallest block. There is no honest single number once heights differ, so this is
        // a compatibility value for clients that have not learned about blocks yet.
        return findByPropertyId(propertyId).stream()
                .map(BlockTbl::getTotalFloors)
                .filter(java.util.Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(null);
    }

    private BlockDTOs.BlockResponse toResponse(BlockTbl block) {
        return new BlockDTOs.BlockResponse(
                block.getId(),
                block.getProperty().getId(),
                block.getName(),
                block.getSortOrder(),
                block.isDefault(),
                block.getTotalFloors(),
                unitRepository.countByBlockId(block.getId()));
    }
}
