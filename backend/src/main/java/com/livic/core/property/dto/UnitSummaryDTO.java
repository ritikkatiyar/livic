package com.livic.core.property.dto;

import com.livic.platform.common.domain.FacingDirection;
import com.livic.platform.common.domain.UnitType;
import com.livic.core.property.domain.UnitTbl;

import java.util.UUID;

public record UnitSummaryDTO(
        UUID id,
        UUID propertyId,
        String propertyName,
        UUID blockId,
        String blockName,
        String unitNumber,
        Integer floor,
        Integer capacity,
        Integer gridX,
        Integer gridY,
        Integer gridWidth,
        Integer gridHeight,
        UnitType type,
        FacingDirection facing
) {
    public UnitSummaryDTO(
            UUID id,
            UUID propertyId,
            String propertyName,
            String unitNumber,
            Integer floor,
            Integer capacity,
            Integer gridX,
            Integer gridY,
            Integer gridWidth,
            Integer gridHeight,
            UnitType type,
            FacingDirection facing
    ) {
        this(id, propertyId, propertyName, null, null, unitNumber, floor, capacity, gridX, gridY, gridWidth, gridHeight, type, facing);
    }

    public static UnitSummaryDTO from(UnitTbl u) {
        if (u == null) {
            return null;
        }
        UUID propId = u.getProperty() != null ? u.getProperty().getId() : null;
        String propName = u.getProperty() != null ? u.getProperty().getName() : null;
        UUID blkId = u.getBlock() != null ? u.getBlock().getId() : null;
        String blkName = u.getBlock() != null ? u.getBlock().getName() : null;
        return new UnitSummaryDTO(
                u.getId(),
                propId,
                propName,
                blkId,
                blkName,
                u.getUnitNumber(),
                u.getFloor(),
                u.getCapacity(),
                u.getGridX(),
                u.getGridY(),
                u.getGridWidth(),
                u.getGridHeight(),
                u.getType(),
                u.getFacing()
        );
    }
}
