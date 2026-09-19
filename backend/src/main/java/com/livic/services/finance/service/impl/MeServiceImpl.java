package com.livic.services.finance.service.impl;

import com.livic.platform.auth.dto.MembershipSummaryDTO;
import com.livic.platform.auth.facade.AuthFacade;
import com.livic.platform.common.exception.BusinessException;
import com.livic.services.finance.dto.MeDTOs;
import com.livic.services.finance.facade.FinanceFacade;
import com.livic.services.finance.service.interfaces.MeService;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import com.livic.services.property.dto.PropertySummaryDTO;
import com.livic.services.property.dto.UnitResidentDTO;
import com.livic.services.property.facade.PropertyFacade;
import com.livic.services.property.facade.UnitMemberFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MeServiceImpl implements MeService {

    private final UserFacade userFacade;
    private final AuthFacade authFacade;
    private final FinanceFacade financeFacade;
    private final UnitMemberFacade unitMemberFacade;
    private final PropertyFacade propertyFacade;

    @Override
    @Transactional(readOnly = true)
    public MeDTOs.MyContextResponse getUserContext(UUID userId) {
        UserSummaryDTO user = userFacade.getUserById(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));

        List<MembershipSummaryDTO> memberships = authFacade.getMembershipsByUserId(userId);
        Map<UUID, Set<String>> permissionCodes = authFacade.getEffectivePermissionCodes(userId);

        List<MeDTOs.MembershipSummary> managedProperties = memberships.stream()
                .filter(MembershipSummaryDTO::isActive)
                .filter(m -> m.propertyId() != null)
                .map(m -> MeDTOs.MembershipSummary.from(m, permissionCodes.getOrDefault(m.propertyId(), Set.of())))
                .toList();

        List<MeDTOs.MembershipSummary> tenantProperties = List.of();

        List<MeDTOs.ActiveLeaseSummary> activeLeases = financeFacade.getActiveLeaseForUser(userId)
                .map(lease -> List.of(MeDTOs.ActiveLeaseSummary.from(lease)))
                .orElse(List.of());

        // Every unit this person belongs to — owned, rented, or lived in with family.
        List<UnitResidentDTO> residences = unitMemberFacade.getActiveResidencesByUserId(userId);
        Map<UUID, PropertySummaryDTO> propertiesById = propertyFacade.getPropertiesByIds(
                residences.stream().map(UnitResidentDTO::propertyId).filter(java.util.Objects::nonNull).distinct().toList());
        List<MeDTOs.UnitMembershipSummary> unitMemberships = residences.stream()
                .map(residence -> new MeDTOs.UnitMembershipSummary(
                        residence.memberId(),
                        residence.unitId(),
                        residence.unitNumber(),
                        residence.floor(),
                        residence.propertyId(),
                        propertiesById.containsKey(residence.propertyId())
                                ? propertiesById.get(residence.propertyId()).name() : null,
                        residence.role(),
                        residence.leaseId()))
                .toList();

        return MeDTOs.MyContextResponse.build(
                user.globalRole(),
                managedProperties,
                tenantProperties,
                activeLeases,
                unitMemberships
        );
    }
}
