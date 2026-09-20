package com.livic.core.property.service.impl;

import com.livic.platform.common.exception.BusinessException;
import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.domain.UnitMemberTbl;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.repository.UnitMemberRepository;
import com.livic.core.property.service.interfaces.UnitMemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UnitMemberServiceImpl implements UnitMemberService {

    private final UnitMemberRepository unitMemberRepository;

    @Override
    public UnitMemberTbl addTenant(UUID unitId, UUID userId, UUID leaseId, LocalDate from, UUID assignedBy) {
        return unitMemberRepository.findFirstByLeaseIdAndIsActiveTrue(leaseId)
                .orElseGet(() -> unitMemberRepository.save(UnitMemberTbl.builder()
                        .unitId(unitId)
                        .userId(userId)
                        .role(UnitMemberRole.TENANT)
                        .isPrimary(true)
                        .leaseId(leaseId)
                        .fromDate(from != null ? from : LocalDate.now())
                        .isActive(true)
                        .assignedBy(assignedBy)
                        .build()));
    }

    @Override
    public void endTenancy(UUID leaseId, LocalDate on) {
        unitMemberRepository.findFirstByLeaseIdAndIsActiveTrue(leaseId).ifPresent(member -> {
            member.end(on != null ? on : LocalDate.now());
            unitMemberRepository.save(member);
        });
    }

    @Override
    public UnitMemberTbl addMember(UUID unitId, UUID userId, UnitMemberRole role, boolean isPrimary,
                                   LocalDate from, UUID assignedBy) {
        if (role == UnitMemberRole.TENANT) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Tenants are added through their lease");
        }
        if (userId != null && unitMemberRepository.existsByUnitIdAndUserIdAndRoleAndIsActiveTrue(unitId, userId, role)) {
            throw new BusinessException(HttpStatus.CONFLICT, "This person already holds that role on the unit");
        }
        if (role == UnitMemberRole.OWNER && isPrimary
                && !unitMemberRepository.findByUnitIdAndRoleAndIsActiveTrue(unitId, UnitMemberRole.OWNER).isEmpty()) {
            throw new BusinessException(HttpStatus.CONFLICT, "The unit already has an owner");
        }
        return unitMemberRepository.save(UnitMemberTbl.builder()
                .unitId(unitId)
                .userId(userId)
                .role(role)
                .isPrimary(isPrimary)
                .fromDate(from != null ? from : LocalDate.now())
                .isActive(true)
                .assignedBy(assignedBy)
                .build());
    }

    @Override
    public void endMember(UUID memberId, LocalDate on) {
        UnitMemberTbl member = unitMemberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit member not found"));
        member.end(on != null ? on : LocalDate.now());
        unitMemberRepository.save(member);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitMemberTbl> findActiveByUnitId(UUID unitId) {
        return unitMemberRepository.findByUnitIdAndIsActiveTrue(unitId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitMemberTbl> findActiveByUnitIds(Collection<UUID> unitIds) {
        return unitIds == null || unitIds.isEmpty()
                ? List.of()
                : unitMemberRepository.findByUnitIdInAndIsActiveTrue(unitIds);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitMemberTbl> findActiveByUserId(UUID userId) {
        return unitMemberRepository.findByUserIdAndIsActiveTrue(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitMemberTbl> findActiveByPropertyId(UUID propertyId) {
        return unitMemberRepository.findActiveByPropertyId(propertyId);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UnitMemberTbl> findActiveByLeaseId(UUID leaseId) {
        return unitMemberRepository.findFirstByLeaseIdAndIsActiveTrue(leaseId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitResidentDTO> findActiveResidentsByPropertyId(UUID propertyId) {
        return unitMemberRepository.findActiveResidentsByPropertyId(propertyId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitResidentDTO> findResidentsByMemberIds(Collection<UUID> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) {
            return List.of();
        }
        return unitMemberRepository.findResidentsByMemberIds(memberIds);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UnitResidentDTO> findResidentByLeaseId(UUID leaseId) {
        if (leaseId == null) {
            return Optional.empty();
        }
        return unitMemberRepository.findResidentsByLeaseId(leaseId).stream().findFirst();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitResidentDTO> findActiveResidencesByUserId(UUID userId) {
        return userId == null ? List.of() : unitMemberRepository.findActiveResidencesByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isActiveMember(UUID userId, UUID unitId, UnitMemberRole role) {
        return userId != null
                && unitMemberRepository.existsByUnitIdAndUserIdAndRoleAndIsActiveTrue(unitId, userId, role);
    }
}
