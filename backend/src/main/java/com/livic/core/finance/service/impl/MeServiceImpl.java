package com.livic.core.finance.service.impl;

import com.livic.platform.auth.dto.MembershipSummaryDTO;
import com.livic.platform.auth.facade.AuthFacade;
import com.livic.platform.common.exception.BusinessException;
import com.livic.core.finance.dto.MeDTOs;
import com.livic.core.finance.service.interfaces.MeService;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.property.facade.UnitMemberFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class MeServiceImpl implements MeService {

    private final UserFacade userFacade;
    private final AuthFacade authFacade;
    private final UnitMemberFacade unitMemberFacade;
    private final PropertyFacade propertyFacade;

    @Override
    @Transactional(readOnly = true)
    public MeDTOs.MyContextResponse getUserContext(UUID userId) {
        UserSummaryDTO user = userFacade.getUserById(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));

        List<MembershipSummaryDTO> memberships = authFacade.getMembershipsByUserId(userId).stream()
                .filter(MembershipSummaryDTO::isActive)
                .filter(m -> m.propertyId() != null)
                .toList();
        Map<UUID, Set<String>> permissionCodes = authFacade.getEffectivePermissionCodes(userId);

        // Every unit this person belongs to — owned, rented, or lived in with family.
        List<UnitResidentDTO> residences = unitMemberFacade.getActiveResidencesByUserId(userId);

        // One lookup names both lists; auth and unit membership only carry the property id.
        Map<UUID, PropertySummaryDTO> propertiesById = propertyFacade.getPropertiesByIds(Stream.concat(
                        memberships.stream().map(MembershipSummaryDTO::propertyId),
                        residences.stream().map(UnitResidentDTO::propertyId))
                .filter(Objects::nonNull)
                .distinct()
                .toList());

        List<MeDTOs.MembershipSummary> managedProperties = memberships.stream()
                .map(m -> MeDTOs.MembershipSummary.from(m, propertyName(propertiesById, m.propertyId()),
                        permissionCodes.getOrDefault(m.propertyId(), Set.of())))
                .toList();

        List<MeDTOs.MembershipSummary> tenantProperties = List.of();

        List<MeDTOs.UnitMembershipSummary> unitMemberships = residences.stream()
                .map(residence -> new MeDTOs.UnitMembershipSummary(
                        residence.memberId(),
                        residence.unitId(),
                        residence.unitNumber(),
                        residence.floor(),
                        residence.propertyId(),
                        propertyName(propertiesById, residence.propertyId()),
                        residence.role(),
                        residence.leaseId()))
                .toList();

        return MeDTOs.MyContextResponse.build(
                user.globalRole(),
                managedProperties,
                tenantProperties,
                unitMemberships
        );
    }

    private static String propertyName(Map<UUID, PropertySummaryDTO> propertiesById, UUID propertyId) {
        PropertySummaryDTO property = propertiesById.get(propertyId);
        return property != null ? property.name() : null;
    }
}
