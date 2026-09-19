package com.livic.services.property.facade.impl;

import com.livic.services.property.domain.UnitMemberRole;
import com.livic.services.property.dto.UnitMemberSummaryDTO;
import com.livic.services.property.facade.UnitMemberFacade;
import com.livic.services.property.service.interfaces.UnitMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UnitMemberFacadeImpl implements UnitMemberFacade {

    private final UnitMemberService unitMemberService;

    @Override
    @Transactional
    public UnitMemberSummaryDTO addTenant(UUID unitId, UUID userId, UUID leaseId, LocalDate from, UUID assignedBy) {
        return UnitMemberSummaryDTO.from(unitMemberService.addTenant(unitId, userId, leaseId, from, assignedBy));
    }

    @Override
    @Transactional
    public void endTenancy(UUID leaseId, LocalDate on) {
        unitMemberService.endTenancy(leaseId, on);
    }

    @Override
    public List<UnitMemberSummaryDTO> getActiveMembersByUnitId(UUID unitId) {
        return unitMemberService.findActiveByUnitId(unitId).stream().map(UnitMemberSummaryDTO::from).toList();
    }

    @Override
    public List<UnitMemberSummaryDTO> getActiveMembersByUnitIds(Collection<UUID> unitIds) {
        return unitMemberService.findActiveByUnitIds(unitIds).stream().map(UnitMemberSummaryDTO::from).toList();
    }

    @Override
    public List<UnitMemberSummaryDTO> getActiveMembersByUserId(UUID userId) {
        return unitMemberService.findActiveByUserId(userId).stream().map(UnitMemberSummaryDTO::from).toList();
    }

    @Override
    public List<UnitMemberSummaryDTO> getActiveMembersByPropertyId(UUID propertyId) {
        return unitMemberService.findActiveByPropertyId(propertyId).stream().map(UnitMemberSummaryDTO::from).toList();
    }

    @Override
    public Optional<UnitMemberSummaryDTO> getActiveMemberByLeaseId(UUID leaseId) {
        return unitMemberService.findActiveByLeaseId(leaseId).map(UnitMemberSummaryDTO::from);
    }

    @Override
    public boolean isActiveMember(UUID userId, UUID unitId, UnitMemberRole role) {
        return unitMemberService.isActiveMember(userId, unitId, role);
    }
}
