package com.livic.core.property.service.impl;

import com.livic.platform.common.exception.BusinessException;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.domain.UnitTbl;
import com.livic.core.property.dto.UnitDTOs;
import com.livic.core.property.domain.BlockTbl;
import com.livic.core.property.service.interfaces.BlockService;
import com.livic.core.property.service.interfaces.UnitCrudService;
import com.livic.core.property.service.interfaces.PropertyQueryService;
import com.livic.core.property.service.interfaces.UnitQueryService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UnitQueryServiceImpl implements UnitQueryService {

    private final UnitCrudService unitCrudService;
    private final PropertyQueryService propertyQueryService;
    private final BlockService blockService;

    @Override
    public UnitTbl getUnitById(UUID id) {
        return unitCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit not found"));
    }

    @Override
    public List<UnitDTOs.FloorSummaryResponse> getFloorSummaries(UUID propertyId, UUID blockId, Integer throughFloor) {
        // Scoped to one block: grouping by floor across the whole property would merge
        // Building A's first floor with Building B's.
        BlockTbl block = blockService.resolveBlock(propertyId, blockId);

        int maxFromUnits = unitCrudService.findMaxFloorByBlockId(block.getId());
        int blockTotalFloors = block.getTotalFloors() != null ? block.getTotalFloors() : 0;
        int requestedTop = throughFloor != null ? throughFloor : 0;
        
        int topFloor;
        if (block.getTotalFloors() != null && block.getTotalFloors() > 0) {
            topFloor = Math.max(block.getTotalFloors(), maxFromUnits);
        } else {
            topFloor = Math.max(requestedTop, maxFromUnits);
        }
        if (topFloor < 1) {
            topFloor = 1;
        }

        Map<Integer, Long> countsByFloor = unitCrudService.findByBlockId(block.getId()).stream()
                .collect(Collectors.groupingBy(UnitTbl::getFloor, Collectors.counting()));

        List<UnitDTOs.FloorSummaryResponse> rows = new ArrayList<>();
        for (int floorNum = topFloor; floorNum >= 1; floorNum--) {
            long unitCount = countsByFloor.getOrDefault(floorNum, 0L);
            String displayLabel = floorNum == 1 ? "Floor 1 (Ground)" : "Floor " + floorNum;
            rows.add(new UnitDTOs.FloorSummaryResponse(
                    floorNum,
                    displayLabel,
                    unitCount > 0,
                    unitCount
            ));
        }
        return rows;
    }

    @Override
    public List<UnitTbl> getUnitsByFloor(UUID propertyId, UUID blockId, int floorNumber) {
        BlockTbl block = blockService.resolveBlock(propertyId, blockId);
        return unitCrudService.findByBlockIdAndFloor(block.getId(), floorNumber);
    }

    @Override
    public List<UnitTbl> getUnitsByProperty(UUID propertyId) {
        return getUnitsByProperty(propertyId, null);
    }

    @Override
    public List<UnitTbl> getUnitsByProperty(UUID propertyId, UUID blockId) {
        if (!propertyQueryService.existsById(propertyId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Property not found");
        }
        if (blockId != null) {
            BlockTbl block = blockService.resolveBlock(propertyId, blockId);
            return unitCrudService.findByBlockId(block.getId());
        }
        return unitCrudService.findByPropertyId(propertyId);
    }
}
