package com.livic.core.property.service.impl;

import com.livic.platform.common.exception.BusinessException;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.domain.UnitTbl;
import com.livic.core.property.dto.UnitDTOs;
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

    @Override
    public UnitTbl getUnitById(UUID id) {
        return unitCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit not found"));
    }

    @Override
    public List<UnitDTOs.FloorSummaryResponse> getFloorSummaries(UUID propertyId, Integer throughFloor) {
        PropertyTbl property = propertyQueryService.getPropertyById(propertyId);
        
        int maxFromUnits = unitCrudService.findMaxFloorByPropertyId(propertyId);
        int propertyTotalFloors = property.getTotalFloors() != null ? property.getTotalFloors() : 0;
        int requestedTop = throughFloor != null ? throughFloor : 0;
        
        int topFloor = Math.max(Math.max(requestedTop, maxFromUnits), propertyTotalFloors);
        if (topFloor < 1) {
            topFloor = 1;
        }

        Map<Integer, Long> countsByFloor = unitCrudService.findByPropertyId(propertyId).stream()
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
    public List<UnitTbl> getUnitsByFloor(UUID propertyId, int floorNumber) {
        if (!propertyQueryService.existsById(propertyId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Property not found");
        }
        return unitCrudService.findByPropertyIdAndFloor(propertyId, floorNumber);
    }

    @Override
    public List<UnitTbl> getUnitsByProperty(UUID propertyId) {
        if (!propertyQueryService.existsById(propertyId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Property not found");
        }
        return unitCrudService.findByPropertyId(propertyId);
    }
}
