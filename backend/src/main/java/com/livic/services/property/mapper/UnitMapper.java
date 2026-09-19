package com.livic.services.property.mapper;

import com.livic.platform.common.domain.FacingDirection;
import com.livic.services.property.domain.BlockTbl;
import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.domain.UnitTbl;
import com.livic.services.property.dto.PropertyDTOs;
import com.livic.services.property.dto.UnitDTOs;

public final class UnitMapper {

    private UnitMapper() {
    }

    public static UnitTbl toEntity(UnitDTOs.FloorLayoutUnitRequest request, PropertyTbl property, BlockTbl block, int floorNumber) {
        FacingDirection facing = request.facing() != null ? request.facing() : FacingDirection.UNKNOWN;
        return UnitTbl.builder()
                .property(property)
                .block(block)
                .unitNumber(request.unitNumber())
                .floor(floorNumber)
                .gridX(request.gridX())
                .gridY(request.gridY())
                .gridWidth(request.gridWidth() != null ? request.gridWidth() : 1)
                .gridHeight(request.gridHeight() != null ? request.gridHeight() : 1)
                .type(request.type())
                .capacity(request.capacity())
                .facing(facing)
                .build();
    }

    public static UnitTbl toEntity(PropertyDTOs.BatchUnitRequest request, PropertyTbl property, BlockTbl block, int floorNumber, int gridX, int gridY, int gridWidth, int gridHeight, String unitNumber) {
        return UnitTbl.builder()
                .property(property)
                .block(block)
                .unitNumber(unitNumber)
                .floor(floorNumber)
                .gridX(gridX)
                .gridY(gridY)
                .gridWidth(gridWidth)
                .gridHeight(gridHeight)
                .type(request.unitType())
                .capacity(request.capacity())
                .facing(FacingDirection.UNKNOWN)
                .build();
    }

    public static void updateEntity(UnitDTOs.FloorLayoutUnitRequest request, UnitTbl unit) {
        unit.setGridX(request.gridX());
        unit.setGridY(request.gridY());
        unit.setGridWidth(request.gridWidth() != null ? request.gridWidth() : 1);
        unit.setGridHeight(request.gridHeight() != null ? request.gridHeight() : 1);
        unit.setType(request.type());
        unit.setCapacity(request.capacity());
        unit.setFacing(request.facing() != null ? request.facing() : FacingDirection.UNKNOWN);
    }
}
