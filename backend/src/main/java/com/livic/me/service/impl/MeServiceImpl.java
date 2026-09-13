package com.livic.me.service.impl;

import com.livic.auth.dto.MembershipSummaryDTO;
import com.livic.auth.facade.AuthFacade;
import com.livic.common.exception.BusinessException;
import com.livic.finance.facade.FinanceFacade;
import com.livic.me.dto.MeDTOs;
import com.livic.me.service.interfaces.MeService;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MeServiceImpl implements MeService {

    private final UserFacade userFacade;
    private final AuthFacade authFacade;
    private final FinanceFacade financeFacade;

    @Override
    @Transactional(readOnly = true)
    public MeDTOs.MyContextResponse getUserContext(UUID userId) {
        UserSummaryDTO user = userFacade.getUserById(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));

        List<MembershipSummaryDTO> memberships = authFacade.getMembershipsByUserId(userId);

        List<MeDTOs.MembershipSummary> managedProperties = memberships.stream()
                .filter(MembershipSummaryDTO::isActive)
                .filter(m -> m.propertyId() != null)
                .map(MeDTOs.MembershipSummary::from)
                .toList();

        List<MeDTOs.MembershipSummary> tenantProperties = List.of();

        List<MeDTOs.ActiveLeaseSummary> activeLeases = financeFacade.getActiveLeaseForUser(userId)
                .map(lease -> List.of(MeDTOs.ActiveLeaseSummary.from(lease)))
                .orElse(List.of());

        return MeDTOs.MyContextResponse.build(
                user.globalRole(),
                managedProperties,
                tenantProperties,
                activeLeases
        );
    }
}
