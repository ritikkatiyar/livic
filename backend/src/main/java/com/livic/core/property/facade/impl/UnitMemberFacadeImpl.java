package com.livic.core.property.facade.impl;

import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.dto.UnitMemberSummaryDTO;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.core.property.service.interfaces.UnitMemberService;
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
    public List<UnitResidentDTO> getActiveResidentsByPropertyId(UUID propertyId) {
        return unitMemberService.findActiveResidentsByPropertyId(propertyId);
    }

    @Override
    public Optional<UnitResidentDTO> getResidentByMemberId(UUID memberId) {
        if (memberId == null) {
            return Optional.empty();
        }
        return unitMemberService.findResidentsByMemberIds(List.of(memberId)).stream().findFirst();
    }

    @Override
    public List<UnitResidentDTO> getResidentsByMemberIds(Collection<UUID> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) {
            return List.of();
        }
        return unitMemberService.findResidentsByMemberIds(memberIds);
    }

    @Override
    public Optional<UnitResidentDTO> getResidentByLeaseId(UUID leaseId) {
        return unitMemberService.findResidentByLeaseId(leaseId);
    }

    @Override
    public List<UnitResidentDTO> getActiveResidencesByUserId(UUID userId) {
        return unitMemberService.findActiveResidencesByUserId(userId);
    }

    @Override
    public boolean isActiveMember(UUID userId, UUID unitId, UnitMemberRole role) {
        return unitMemberService.isActiveMember(userId, unitId, role);
    }
}
