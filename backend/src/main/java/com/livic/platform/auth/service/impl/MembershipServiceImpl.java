package com.livic.platform.auth.service.impl;

import com.livic.platform.auth.repository.PermissionRepository;
import com.livic.platform.auth.repository.MembershipPermissionRepository;
import com.livic.platform.auth.repository.MembershipRepository;
import com.livic.platform.auth.domain.MembershipPermissionTbl;
import com.livic.platform.auth.domain.MembershipTbl;
import com.livic.platform.auth.dto.MembershipDTOs;
import com.livic.platform.auth.mapper.MembershipMapper;
import com.livic.platform.auth.service.interfaces.MembershipService;
import com.livic.platform.common.constant.StaffPermission;
import com.livic.platform.common.enums.AccessType;
import com.livic.platform.common.event.MemberSeatRequestedEvent;
import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MembershipServiceImpl implements MembershipService {

    private final MembershipRepository membershipRepository;
    private final MembershipPermissionRepository membershipPermissionRepository;
    private final PermissionRepository permissionRepository;
    private final UserFacade userFacade;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public void createOwnerMembership(UUID propertyId, UUID ownerId) {
        userFacade.getUserById(ownerId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Owner user not found"));

        Optional<MembershipTbl> existing = membershipRepository.findByUserIdAndPropertyId(ownerId, propertyId);
        if (existing.isPresent()) {
            MembershipTbl m = existing.get();
            m.setAccessType(AccessType.FULL_ACCESS);
            m.setTitle("Owner");
            m.setActive(true);
            membershipRepository.save(m);
            return;
        }

        MembershipTbl membership = MembershipTbl.builder()
                .userId(ownerId)
                .propertyId(propertyId)
                .title("Owner")
                .accessType(AccessType.FULL_ACCESS)
                .isActive(true)
                .assignedBy(ownerId)
                .build();
        
        membershipRepository.save(membership);
    }

    @Override
    @Transactional
    public MembershipTbl createMembership(UUID propertyId, UUID userId, String title, AccessType accessType, Set<String> permissionCodes, UUID assignedByUserId) {
        if (membershipRepository.existsByUserIdAndPropertyId(userId, propertyId)) {
            throw new BusinessException(HttpStatus.CONFLICT, "User is already a member of this property");
        }
        
        userFacade.getUserById(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));

        if (AccessType.FULL_ACCESS.equals(accessType)) {
            boolean callerHasFullAccess = membershipRepository.existsByUserIdAndPropertyIdAndAccessType(assignedByUserId, propertyId, AccessType.FULL_ACCESS);
            if (!callerHasFullAccess) {
                throw new BusinessException(HttpStatus.FORBIDDEN, "Only members with Full Access can grant Full Access.");
            }
        }

        validatePermissionCodes(permissionCodes);

        eventPublisher.publishEvent(new MemberSeatRequestedEvent(this, propertyId));

        MembershipTbl membership = MembershipTbl.builder()
                .userId(userId)
                .propertyId(propertyId)
                .title(title != null && !title.isBlank() ? title : "Member")
                .accessType(accessType != null ? accessType : AccessType.CUSTOM_ACCESS)
                .isActive(true)
                .assignedBy(assignedByUserId)
                .build();
                
        MembershipTbl saved = membershipRepository.save(membership);

        if (AccessType.CUSTOM_ACCESS.equals(saved.getAccessType()) && permissionCodes != null && !permissionCodes.isEmpty()) {
            membershipPermissionRepository.saveAll(permissionRepository.findByCodeIn(permissionCodes).stream()
                    .map(p -> MembershipPermissionTbl.builder().membership(saved).permission(p).build())
                    .toList());
        }

        return saved;
    }

    @Override
    @Transactional
    public MembershipDTOs.MembershipResponse updateMembership(UUID propertyId, UUID membershipId, String title, AccessType accessType, Boolean isActive, Set<String> permissionCodes, UUID actorUserId) {
        MembershipTbl membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Membership not found"));

        if (!propertyId.equals(membership.getPropertyId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Membership does not belong to this property");
        }

        boolean actorHasFullAccess = membershipRepository.existsByUserIdAndPropertyIdAndAccessType(actorUserId, propertyId, AccessType.FULL_ACCESS);
        if (!actorHasFullAccess) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Only Full Access members can update membership permissions and access.");
        }

        validatePermissionCodes(permissionCodes);

        if (title != null && !title.isBlank()) {
            membership.setTitle(title.trim());
        }

        if (accessType != null) {
            if (membership.isFullAccess() && AccessType.CUSTOM_ACCESS.equals(accessType)) {
                ensureNotDemotingLastFullAccess(propertyId, membership.getId());
            }
            membership.setAccessType(accessType);
        }

        if (isActive != null) {
            if (membership.isFullAccess() && !isActive) {
                ensureNotDemotingLastFullAccess(propertyId, membership.getId());
            }
            membership.setActive(isActive);
        }

        MembershipTbl updated = membershipRepository.save(membership);

        if (permissionCodes != null) {
            membershipPermissionRepository.deleteByMembershipId(updated.getId());
            if (AccessType.CUSTOM_ACCESS.equals(updated.getAccessType()) && !permissionCodes.isEmpty()) {
                membershipPermissionRepository.saveAll(permissionRepository.findByCodeIn(permissionCodes).stream()
                        .map(p -> MembershipPermissionTbl.builder().membership(updated).permission(p).build())
                        .toList());
            }
        }

        return MembershipMapper.toMembershipResponse(
                updated,
                userFacade.getUserById(updated.getUserId()).orElse(null),
                membershipPermissionRepository.findPermissionCodesByMembershipId(updated.getId()));
    }

    @Override
    @Transactional
    public void toggleMembershipActive(UUID propertyId, UUID membershipId, boolean isActive, UUID actorUserId) {
        MembershipTbl membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Membership not found"));

        if (!propertyId.equals(membership.getPropertyId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Membership does not belong to this property");
        }

        if (membership.isFullAccess() && !isActive) {
            ensureNotDemotingLastFullAccess(propertyId, membership.getId());
        }

        if (isActive && !membership.isActive()) {
            eventPublisher.publishEvent(new MemberSeatRequestedEvent(this, propertyId));
        }

        membership.setActive(isActive);
        membershipRepository.save(membership);
    }

    @Override
    @Transactional
    public void removeMembership(UUID propertyId, UUID membershipId, UUID actorUserId) {
        MembershipTbl membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Membership not found"));
        
        if (!propertyId.equals(membership.getPropertyId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Membership does not belong to this property");
        }

        if (membership.isFullAccess()) {
            ensureNotDemotingLastFullAccess(propertyId, membership.getId());
        }

        membershipPermissionRepository.deleteByMembershipId(membership.getId());
        membershipRepository.delete(membership);
    }

    @Override
    @Transactional
    public void transferOwnership(UUID propertyId, UUID currentOwnerId, UUID toUserId) {
        userFacade.getUserById(toUserId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Target owner user not found"));

        Optional<MembershipTbl> toUserMembershipOpt = membershipRepository.findByUserIdAndPropertyId(toUserId, propertyId);
        if (toUserMembershipOpt.isPresent()) {
            MembershipTbl m = toUserMembershipOpt.get();
            m.setAccessType(AccessType.FULL_ACCESS);
            m.setTitle("Owner");
            m.setActive(true);
            membershipRepository.save(m);
        } else {
            MembershipTbl newMembership = MembershipTbl.builder()
                    .userId(toUserId)
                    .propertyId(propertyId)
                    .title("Owner")
                    .accessType(AccessType.FULL_ACCESS)
                    .isActive(true)
                    .assignedBy(currentOwnerId)
                    .build();
            membershipRepository.save(newMembership);
        }
    }

    private void validatePermissionCodes(Set<String> permissionCodes) {
        if (permissionCodes == null) return;
        List<String> unknown = permissionCodes.stream().filter(code -> !StaffPermission.isValid(code)).sorted().toList();
        if (!unknown.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Unknown permission codes: " + String.join(", ", unknown));
        }
    }

    private void ensureNotDemotingLastFullAccess(UUID propertyId, UUID currentMembershipId) {
        List<MembershipTbl> fullAccessMembers = membershipRepository.findByPropertyIdAndAccessType(propertyId, AccessType.FULL_ACCESS);
        long activeFullAccessCount = fullAccessMembers.stream()
                .filter(MembershipTbl::isActive)
                .filter(m -> !m.getId().equals(currentMembershipId))
                .count();
        if (activeFullAccessCount < 1) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot remove, deactivate, or demote the only active Full Access member on the property.");
        }
    }
}
