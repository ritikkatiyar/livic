package com.livic.core.property.service.impl;

import com.livic.platform.common.exception.BusinessException;
import com.livic.core.property.domain.UnitTbl;
import com.livic.core.property.dto.UnitDTOs;
import com.livic.core.property.service.interfaces.UnitService;
import com.livic.core.property.service.interfaces.UnitQueryService;
import com.livic.core.property.spi.UnitOccupancyProvider;
import com.livic.core.property.spi.UnitOccupancyProvider.UnitOccupant;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Application Service to orchestrate unit layouts with lease occupancy and user details.
 * Occupancy comes through {@link UnitOccupancyProvider}, so property does not depend on finance.
 * This keeps the Controllers thin and Domain Services pure.
 */
@Service
@RequiredArgsConstructor
public class UnitLayoutOrchestrationService {

    private final UnitService unitService;
    private final UnitQueryService unitQueryService;
    private final UnitOccupancyProvider unitOccupancyProvider;
    private final UserFacade userFacade;

    public List<UnitDTOs.UnitResponse> getFloorLayout(UUID propertyId, int floorNumber) {
        List<UnitTbl> units = unitQueryService.getUnitsByFloor(propertyId, floorNumber);
        return enrichUnits(units);
    }

    public List<UnitDTOs.UnitResponse> getAllFloorsLayout(UUID propertyId) {
        List<UnitTbl> units = unitQueryService.getUnitsByProperty(propertyId);
        return enrichUnits(units);
    }

    public List<UnitDTOs.UnitResponse> getVacatingUnits(UUID propertyId) {
        Set<UUID> vacatingUnitIds = unitOccupancyProvider.vacatingUnitIds(propertyId);

        List<UnitTbl> units = unitQueryService.getUnitsByProperty(propertyId).stream()
                .filter(unit -> vacatingUnitIds.contains(unit.getId()))
                .collect(Collectors.toList());
        return enrichUnits(units);
    }

    public List<UnitDTOs.UnitResponse> saveFloorLayout(
            UUID propertyId,
            int floorNumber,
            List<UnitDTOs.FloorLayoutUnitRequest> items) {

        List<UnitTbl> existingUnits = unitQueryService.getUnitsByFloor(propertyId, floorNumber);
        Set<String> incomingNumbers = items.stream()
                .map(UnitDTOs.FloorLayoutUnitRequest::unitNumber)
                .collect(Collectors.toSet());

        for (UnitTbl unit : existingUnits) {
            if (!incomingNumbers.contains(unit.getUnitNumber())) {
                if (unitOccupancyProvider.hasLeasesForUnit(unit.getId())) {
                    throw new BusinessException(
                            HttpStatus.CONFLICT,
                            "Cannot remove unit " + unit.getUnitNumber() + " from the layout while leases reference it"
                    );
                }
            }
        }

        List<UnitTbl> saved = unitService.saveFloorLayout(propertyId, floorNumber, items);
        return enrichUnits(saved);
    }

    private List<UnitDTOs.UnitResponse> enrichUnits(List<UnitTbl> units) {
        Map<UUID, List<UnitOccupant>> occupantsByUnitId = unitOccupancyProvider.activeOccupantsByUnitIds(
                units.stream().map(UnitTbl::getId).collect(Collectors.toSet())
        );
        Map<UUID, UserSummaryDTO> usersById = userFacade.getUsersByIds(
                occupantsByUnitId.values().stream()
                        .flatMap(List::stream)
                        .map(UnitOccupant::userId)
                        .collect(Collectors.toSet())
        );

        return units.stream()
                .map(unit -> toResponse(unit, occupantsByUnitId.getOrDefault(unit.getId(), List.of()), usersById))
                .collect(Collectors.toList());
    }

    private UnitDTOs.UnitResponse toResponse(UnitTbl u, List<UnitOccupant> occupants, Map<UUID, UserSummaryDTO> usersById) {
        return new UnitDTOs.UnitResponse(
                u.getId(),
                u.getUnitNumber(),
                u.getFloor(),
                u.getGridX(),
                u.getGridY(),
                u.getGridWidth(),
                u.getGridHeight(),
                u.getType(),
                u.getCapacity(),
                u.getFacing(),
                toActiveLeaseSummaries(occupants, usersById)
        );
    }

    private List<UnitDTOs.ActiveLeaseSummary> toActiveLeaseSummaries(List<UnitOccupant> occupants, Map<UUID, UserSummaryDTO> usersById) {
        return occupants.stream()
                .map(o -> {
                    UserSummaryDTO user = usersById.get(o.userId());
                    return new UnitDTOs.ActiveLeaseSummary(
                            o.leaseId(),
                            o.userId(),
                            user != null ? user.fullName() : "Unknown User",
                            user != null ? user.phoneNumber() : "",
                            o.rentAmount(),
                            o.status() != null ? o.status() : "ACTIVE"
                    );
                })
                .collect(Collectors.toList());
    }
}
