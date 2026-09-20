package com.livic.core.property.service.impl;

import com.livic.platform.common.domain.FacingDirection;
import com.livic.platform.common.event.UnitsCreationRequestedEvent;
import com.livic.platform.common.exception.BusinessException;
import com.livic.core.property.domain.BlockTbl;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.dto.PropertyDTOs;
import com.livic.core.property.domain.UnitTbl;
import com.livic.core.property.dto.UnitDTOs;
import com.livic.core.property.mapper.UnitMapper;
import com.livic.core.property.repository.UnitRepository;
import com.livic.core.property.service.interfaces.UnitCrudService;
import com.livic.core.property.service.interfaces.UnitService;
import com.livic.core.property.service.interfaces.BlockService;
import com.livic.core.property.service.interfaces.PropertyQueryService;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;

@Service
@RequiredArgsConstructor
@Transactional
public class UnitServiceImpl implements UnitService {

    private final UnitCrudService unitCrudService;
    private final PropertyQueryService propertyQueryService;
    private final BlockService blockService;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public List<UnitTbl> saveAll(List<UnitTbl> units) {
        return unitCrudService.saveAll(units);
    }

    @Override
    public List<UnitTbl> saveFloorLayout(
            UUID propertyId,
            UUID blockId,
            int floorNumber,
            List<UnitDTOs.FloorLayoutUnitRequest> items
    ) {
        if (floorNumber < 1) {
            throw new BusinessException("Floor number must be at least 1");
        }
        PropertyTbl property = propertyQueryService.getPropertyById(propertyId);
        BlockTbl block = blockService.resolveBlock(propertyId, blockId);

        Set<String> seenNumbers = new HashSet<>();
        for (UnitDTOs.FloorLayoutUnitRequest item : items) {
            if (!seenNumbers.add(item.unitNumber())) {
                throw new BusinessException("Duplicate unit number in layout: " + item.unitNumber());
            }
        }

        List<UnitTbl> onFloor = unitCrudService.findByBlockIdAndFloor(block.getId(), floorNumber);
        Set<String> incomingNumbers = items.stream()
                .map(UnitDTOs.FloorLayoutUnitRequest::unitNumber)
                .collect(Collectors.toSet());

        List<UnitTbl> toRemove = onFloor.stream()
                .filter(u -> !incomingNumbers.contains(u.getUnitNumber()))
                .toList();

        Set<String> onFloorNumbers = onFloor.stream().map(UnitTbl::getUnitNumber).collect(Collectors.toSet());
        long newUnits = incomingNumbers.stream().filter(number -> !onFloorNumbers.contains(number)).count();
        int netAdditionalUnits = (int) newUnits - toRemove.size();
        if (netAdditionalUnits > 0) {
            eventPublisher.publishEvent(new UnitsCreationRequestedEvent(this, propertyId, netAdditionalUnits));
        }

        // Optimized: batch delete
        unitCrudService.deleteAll(toRemove);

        // Optimized: bulk cache unit numbers to avoid exists queries inside loops
        // Unit numbers are unique per block, not per property: Building A and Building B
        // both having a 101 is the point of blocks.
        Set<String> allExistingUnitNumbers = unitCrudService.findByBlockId(block.getId()).stream()
                .map(UnitTbl::getUnitNumber)
                .collect(Collectors.toSet());

        Map<String, UnitTbl> existingOnFloorByNumber = unitCrudService.findByBlockIdAndFloor(block.getId(), floorNumber)
                .stream()
                .collect(Collectors.toMap(UnitTbl::getUnitNumber, u -> u, (a, b) -> a));

        List<UnitTbl> toSave = new ArrayList<>();
        for (UnitDTOs.FloorLayoutUnitRequest item : items) {
            UnitTbl entity = existingOnFloorByNumber.get(item.unitNumber());
            if (entity != null) {
                UnitMapper.updateEntity(item, entity);
                toSave.add(entity);
            } else {
                // Optimized: check in-memory cached Set instead of querying database in loop
                if (allExistingUnitNumbers.contains(item.unitNumber())) {
                    throw new BusinessException(
                            "Unit number \"" + item.unitNumber() + "\" already exists on another floor of this block"
                    );
                }
                UnitTbl created = UnitMapper.toEntity(item, property, block, floorNumber);
                toSave.add(created);
            }
        }
        // Optimized: batch save
        return unitCrudService.saveAll(toSave);
    }

    @Override
    public List<UnitTbl> generateBatchUnits(UUID propertyId, PropertyDTOs.BatchUnitRequest request) {
        PropertyTbl property = propertyQueryService.getPropertyById(propertyId);
        BlockTbl block = blockService.resolveBlock(propertyId, request.blockId());
        Integer blockFloors = block.getTotalFloors();
        if (request.totalFloors() > 1 || (blockFloors != null && request.totalFloors() == blockFloors && request.startingFloorNumber() == 1)) {
            // Scoped to the block: filling Building B wholesale must not be refused because
            // Building A already has floors.
            boolean hasExistingUnits = !unitCrudService.findByBlockId(block.getId()).isEmpty();
            if (hasExistingUnits) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot configure units globally because this block already has configured floors.");
            }
        }
        List<UnitTbl> generatedUnits = new ArrayList<>();
        int totalGridWidth = 10;
        int totalGridHeight = 15;
        int n = request.unitsPerFloor();

        // Calculate rows (R) to keep units as square-ish as possible.
        // Aspect ratio of grid is 10:15 (2:3).
        // Ideal R is roughly sqrt(1.5 * n).
        int r = (int) Math.round(Math.sqrt(1.5 * n));
        
        // Constrain R so that columns per row don't exceed gridWidth (10) 
        // and rows don't exceed gridHeight (15).
        r = Math.max((int) Math.ceil(n / 10.0), r);
        r = Math.min(totalGridHeight, Math.max(1, r));

        // Basic height & remainder height per row
        int basicHeight = totalGridHeight / r;
        int remainderHeight = totalGridHeight % r;

        // Distribute units across rows
        int basicUnitsPerRow = n / r;
        int remainderUnits = n % r;

        for (int currentFloor = request.startingFloorNumber();
             currentFloor < request.startingFloorNumber() + request.totalFloors();
             currentFloor++) {

            int currentY = 0;
            int unitGlobalIndex = 1;

            for (int rowIdx = 0; rowIdx < r; rowIdx++) {
                int rowHeight = basicHeight + (rowIdx < remainderHeight ? 1 : 0);
                int unitsInThisRow = basicUnitsPerRow + (rowIdx < remainderUnits ? 1 : 0);

                int basicWidth = totalGridWidth / unitsInThisRow;
                int remainderWidth = totalGridWidth % unitsInThisRow;

                int currentX = 0;

                for (int colIdx = 0; colIdx < unitsInThisRow; colIdx++) {
                    int unitWidth = Math.max(1, basicWidth + (colIdx < remainderWidth ? 1 : 0));

                    String prefix = request.prefix() != null ? request.prefix() : "";
                    String unitNumber = prefix + currentFloor + String.format("%02d", unitGlobalIndex);

                    UnitTbl unit = UnitMapper.toEntity(request, property, block, currentFloor, currentX, currentY, unitWidth, rowHeight, unitNumber);

                    generatedUnits.add(unit);
                    currentX += unitWidth;
                    unitGlobalIndex++;
                }

                currentY += rowHeight;
            }
        }
        eventPublisher.publishEvent(new UnitsCreationRequestedEvent(this, propertyId, generatedUnits.size()));
        return saveAll(generatedUnits);
    }
}
