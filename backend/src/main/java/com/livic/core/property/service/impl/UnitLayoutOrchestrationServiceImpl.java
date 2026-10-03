package com.livic.core.property.service.impl;

import com.livic.platform.common.exception.BusinessException;
import com.livic.core.property.domain.UnitTbl;
import com.livic.core.property.dto.PropertyDTOs;
import com.livic.core.property.dto.UnitDTOs;
import com.livic.core.property.service.interfaces.UnitLayoutOrchestrationService;
import com.livic.core.property.service.interfaces.UnitService;
import com.livic.core.property.service.interfaces.UnitQueryService;
import com.livic.core.property.domain.UnitMemberTbl;
import com.livic.core.property.service.interfaces.UnitMemberService;
import com.livic.core.property.spi.MemberAgreementProvider;
import com.livic.core.property.spi.MemberAgreementProvider.MemberAgreement;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Unit layouts with the people in each unit: core's unit members, their user details, and the
 * agreement each holds the unit under when a vertical has one ({@link MemberAgreementProvider}).
 */
@Service
@RequiredArgsConstructor
public class UnitLayoutOrchestrationServiceImpl implements UnitLayoutOrchestrationService {

    private final UnitService unitService;
    private final UnitQueryService unitQueryService;
    private final UnitMemberService unitMemberService;
    private final List<MemberAgreementProvider> agreementProviders;
    private final UserFacade userFacade;

    @Override
    public List<UnitDTOs.UnitResponse> getFloorLayout(UUID propertyId, UUID blockId, int floorNumber) {
        List<UnitTbl> units = unitQueryService.getUnitsByFloor(propertyId, blockId, floorNumber);
        return enrichUnits(units);
    }

    @Override
    public List<UnitDTOs.UnitResponse> getAllFloorsLayout(UUID propertyId) {
        return getAllFloorsLayout(propertyId, null);
    }

    @Override
    public List<UnitDTOs.UnitResponse> getAllFloorsLayout(UUID propertyId, UUID blockId) {
        List<UnitTbl> units = unitQueryService.getUnitsByProperty(propertyId, blockId);
        return enrichUnits(units);
    }

    @Override
    public List<UnitDTOs.UnitResponse> generateBatchUnits(UUID propertyId, PropertyDTOs.BatchUnitRequest request) {
        unitService.generateBatchUnits(propertyId, request);
        return getFloorLayout(propertyId, request.blockId(), request.startingFloorNumber());
    }

    @Override
    public List<UnitDTOs.UnitResponse> getVacatingUnits(UUID propertyId) {
        // A unit is vacating when someone in it has agreed a move-out date.
        List<UnitMemberTbl> members = unitMemberService.findActiveByPropertyId(propertyId);
        Map<UUID, MemberAgreement> agreements = agreementsOf(members);
        Set<UUID> vacatingUnitIds = members.stream()
                .filter(m -> agreements.containsKey(m.getId()) && agreements.get(m.getId()).endDate() != null)
                .map(UnitMemberTbl::getUnitId)
                .collect(Collectors.toSet());

        List<UnitTbl> units = unitQueryService.getUnitsByProperty(propertyId).stream()
                .filter(unit -> vacatingUnitIds.contains(unit.getId()))
                .collect(Collectors.toList());
        return enrichUnits(units);
    }

    @Override
    public List<UnitDTOs.UnitResponse> saveFloorLayout(
            UUID propertyId,
            UUID blockId,
            int floorNumber,
            List<UnitDTOs.FloorLayoutUnitRequest> items) {

        List<UnitTbl> existingUnits = unitQueryService.getUnitsByFloor(propertyId, blockId, floorNumber);
        Set<String> incomingNumbers = items.stream()
                .map(UnitDTOs.FloorLayoutUnitRequest::unitNumber)
                .collect(Collectors.toSet());

        for (UnitTbl unit : existingUnits) {
            if (!incomingNumbers.contains(unit.getUnitNumber())) {
                if (unitMemberService.hasEverHadMembers(unit.getId())) {
                    throw new BusinessException(
                            HttpStatus.CONFLICT,
                            "Cannot remove unit " + unit.getUnitNumber() + " from the layout: it has, or has had, residents"
                    );
                }
            }
        }

        List<UnitTbl> saved = unitService.saveFloorLayout(propertyId, blockId, floorNumber, items);
        return enrichUnits(saved);
    }

    private List<UnitDTOs.UnitResponse> enrichUnits(List<UnitTbl> units) {
        List<UnitMemberTbl> members = unitMemberService.findActiveByUnitIds(
                units.stream().map(UnitTbl::getId).collect(Collectors.toSet()));
        Map<UUID, List<UnitMemberTbl>> membersByUnitId = members.stream()
                .collect(Collectors.groupingBy(UnitMemberTbl::getUnitId));
        Map<UUID, MemberAgreement> agreements = agreementsOf(members);
        Map<UUID, UserSummaryDTO> usersById = userFacade.getUsersByIds(members.stream()
                .map(UnitMemberTbl::getUserId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet()));

        return units.stream()
                .map(unit -> toResponse(unit, membersByUnitId.getOrDefault(unit.getId(), List.of()).stream()
                        .map(m -> toOccupant(m, usersById.get(m.getUserId()), agreements.get(m.getId())))
                        .toList()))
                .collect(Collectors.toList());
    }

    /** The agreements every vertical holds these members under; most members have none. */
    private Map<UUID, MemberAgreement> agreementsOf(List<UnitMemberTbl> members) {
        if (members.isEmpty()) {
            return Map.of();
        }
        List<UUID> memberIds = members.stream().map(UnitMemberTbl::getId).toList();
        Map<UUID, MemberAgreement> agreements = new HashMap<>();
        agreementProviders.forEach(provider -> agreements.putAll(provider.agreementsByMemberIds(memberIds)));
        return agreements;
    }

    private static UnitDTOs.Occupant toOccupant(UnitMemberTbl m, UserSummaryDTO user, MemberAgreement agreement) {
        return new UnitDTOs.Occupant(
                m.getId(),
                m.getUserId(),
                user != null ? user.fullName() : null,
                user != null ? user.phoneNumber() : m.getInvitedPhone(),
                m.getRole(),
                m.getFromDate(),
                agreement
        );
    }

    private UnitDTOs.UnitResponse toResponse(UnitTbl u, List<UnitDTOs.Occupant> members) {
        return new UnitDTOs.UnitResponse(
                u.getId(),
                u.getBlock() != null ? u.getBlock().getId() : null,
                u.getUnitNumber(),
                u.getFloor(),
                u.getGridX(),
                u.getGridY(),
                u.getGridWidth(),
                u.getGridHeight(),
                u.getType(),
                u.getCapacity(),
                u.getFacing(),
                members
        );
    }
}
