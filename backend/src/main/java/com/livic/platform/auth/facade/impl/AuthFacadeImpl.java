package com.livic.platform.auth.facade.impl;

import com.livic.platform.auth.repository.MembershipRepository;
import com.livic.platform.auth.domain.MembershipTbl;
import com.livic.platform.auth.dto.MembershipSummaryDTO;
import com.livic.platform.auth.facade.AuthFacade;
import com.livic.platform.auth.mapper.MembershipMapper;
import com.livic.platform.auth.service.interfaces.MembershipQueryService;
import com.livic.platform.auth.service.interfaces.MembershipService;
import com.livic.platform.common.constant.StaffPermission;
import com.livic.platform.common.enums.AccessType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AuthFacadeImpl implements AuthFacade {

    private final MembershipRepository membershipRepository;
    private final MembershipQueryService membershipQueryService;
    private final MembershipService membershipService;

    @Override
    public List<MembershipSummaryDTO> getMembershipsByUserId(UUID userId) {
        return membershipRepository.findByUserId(userId).stream()
                .map(MembershipMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MembershipSummaryDTO> getMembershipsByPropertyId(UUID propertyId) {
        return membershipRepository.findByPropertyId(propertyId).stream()
                .map(MembershipMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<MembershipSummaryDTO> getMembershipsByPropertyId(UUID propertyId, Pageable pageable) {
        return membershipRepository.findByPropertyId(propertyId, pageable)
                .map(MembershipMapper::toResponse);
    }

    @Override
    public long countMembershipsByPropertyId(UUID propertyId) {
        return membershipRepository.findByPropertyId(propertyId).stream()
                .filter(MembershipTbl::isActive)
                .count();
    }

    @Override
    public Optional<UUID> findPropertyOwnerId(UUID propertyId) {
        List<MembershipTbl> fullAccess = membershipRepository.findByPropertyIdAndAccessType(propertyId, AccessType.FULL_ACCESS)
                .stream()
                .filter(MembershipTbl::isActive)
                .toList();

        return fullAccess.stream()
                .filter(m -> "Owner".equals(m.getTitle()))
                .max(Comparator.comparing(MembershipTbl::getUpdatedAt, Comparator.nullsFirst(Comparator.naturalOrder())))
                .or(() -> fullAccess.stream()
                        .min(Comparator.comparing(MembershipTbl::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))))
                .map(MembershipTbl::getUserId);
    }

    @Override
    public void createOwnerMembership(UUID propertyId, UUID userId) {
        membershipService.createOwnerMembership(propertyId, userId);
    }

    @Override
    public boolean existsByUserIdAndPropertyId(UUID userId, UUID propertyId) {
        return membershipRepository.existsByUserIdAndPropertyId(userId, propertyId);
    }

    @Override
    public MembershipSummaryDTO createMembership(UUID propertyId, UUID userId, String title, AccessType accessType, Set<String> permissionCodes, UUID assignedByUserId) {
        MembershipTbl saved = membershipService.createMembership(propertyId, userId, title, accessType, permissionCodes, assignedByUserId);
        return MembershipMapper.toResponse(saved);
    }

    @Override
    public void toggleMembershipActive(UUID propertyId, UUID membershipId, boolean active, UUID actorId) {
        membershipService.toggleMembershipActive(propertyId, membershipId, active, actorId);
    }

    @Override
    public Map<UUID, Set<String>> getPermissionsByMembershipIds(Collection<UUID> membershipIds) {
        return membershipQueryService.getPermissionsByMembershipIds(membershipIds);
    }

    @Override
    public Map<UUID, Set<String>> getEffectivePermissionCodes(UUID userId) {
        List<MembershipTbl> active = membershipRepository.findByUserId(userId).stream()
                .filter(MembershipTbl::isActive)
                .toList();
        Map<UUID, Set<String>> customCodes = getPermissionsByMembershipIds(active.stream()
                .filter(m -> !m.isFullAccess())
                .map(MembershipTbl::getId)
                .toList());

        Map<UUID, Set<String>> result = new HashMap<>();
        for (MembershipTbl m : active) {
            Set<String> codes = m.isFullAccess()
                    ? StaffPermission.allCodes()
                    : customCodes.getOrDefault(m.getId(), Set.of());
            result.merge(m.getPropertyId(), codes, (a, b) -> {
                Set<String> merged = new HashSet<>(a);
                merged.addAll(b);
                return merged;
            });
        }
        return result;
    }
}
