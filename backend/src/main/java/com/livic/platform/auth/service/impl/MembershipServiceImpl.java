package com.livic.platform.auth.service.impl;

import com.livic.platform.auth.domain.MembershipPermissionTbl;
import com.livic.platform.auth.domain.MembershipTbl;
import com.livic.platform.auth.domain.PermissionTbl;
import com.livic.platform.auth.service.interfaces.MembershipCrudService;
import com.livic.platform.auth.service.interfaces.MembershipPermissionCrudService;
import com.livic.platform.auth.service.interfaces.MembershipService;
import com.livic.platform.auth.service.interfaces.PermissionCrudService;
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

    private final MembershipCrudService membershipCrudService;
    private final MembershipPermissionCrudService membershipPermissionCrudService;
    private final PermissionCrudService permissionCrudService;
    private final UserFacade userFacade;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public void createOwnerMembership(UUID propertyId, UUID ownerId) {
        userFacade.getUserById(ownerId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Owner user not found"));

        Optional<MembershipTbl> existing = membershipCrudService.findByUserIdAndPropertyId(ownerId, propertyId);
        if (existing.isPresent()) {
            MembershipTbl m = existing.get();
            m.setAccessType(AccessType.FULL_ACCESS);
            m.setTitle("Owner");
            m.setActive(true);
            membershipCrudService.save(m);
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
        
        membershipCrudService.save(membership);
    }

    @Override
    @Transactional
    public MembershipTbl createMembership(UUID propertyId, UUID userId, String title, AccessType accessType, Set<String> permissionCodes, UUID assignedByUserId) {
        if (membershipCrudService.existsByUserIdAndPropertyId(userId, propertyId)) {
            throw new BusinessException(HttpStatus.CONFLICT, "User is already a member of this property");
        }
        
        userFacade.getUserById(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));

        if (AccessType.FULL_ACCESS.equals(accessType)) {
            boolean callerHasFullAccess = membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(assignedByUserId, propertyId, AccessType.FULL_ACCESS);
            if (!callerHasFullAccess) {
                throw new BusinessException(HttpStatus.FORBIDDEN, "Only members with Full Access can grant Full Access.");
            }
        }

        eventPublisher.publishEvent(new MemberSeatRequestedEvent(this, propertyId));

        MembershipTbl membership = MembershipTbl.builder()
                .userId(userId)
                .propertyId(propertyId)
                .title(title != null && !title.isBlank() ? title : "Member")
                .accessType(accessType != null ? accessType : AccessType.CUSTOM_ACCESS)
                .isActive(true)
                .assignedBy(assignedByUserId)
                .build();
                
        MembershipTbl saved = membershipCrudService.save(membership);

        if (AccessType.CUSTOM_ACCESS.equals(saved.getAccessType()) && permissionCodes != null && !permissionCodes.isEmpty()) {
            List<PermissionTbl> permissions = permissionCrudService.findByCodeIn(permissionCodes);
            for (PermissionTbl p : permissions) {
                membershipPermissionCrudService.save(MembershipPermissionTbl.builder()
                        .membership(saved)
                        .permission(p)
                        .build());
            }
        }

        return saved;
    }

    @Override
    @Transactional
    public MembershipTbl updateMembership(UUID propertyId, UUID membershipId, String title, AccessType accessType, Boolean isActive, Set<String> permissionCodes, UUID actorUserId) {
        MembershipTbl membership = membershipCrudService.findById(membershipId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Membership not found"));

        if (!propertyId.equals(membership.getPropertyId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Membership does not belong to this property");
        }

        boolean actorHasFullAccess = membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(actorUserId, propertyId, AccessType.FULL_ACCESS);
        if (!actorHasFullAccess) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Only Full Access members can update membership permissions and access.");
        }

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

        MembershipTbl updated = membershipCrudService.save(membership);

        if (permissionCodes != null) {
            membershipPermissionCrudService.deleteByMembershipId(updated.getId());
            if (AccessType.CUSTOM_ACCESS.equals(updated.getAccessType()) && !permissionCodes.isEmpty()) {
                List<PermissionTbl> permissions = permissionCrudService.findByCodeIn(permissionCodes);
                for (PermissionTbl p : permissions) {
                    membershipPermissionCrudService.save(MembershipPermissionTbl.builder()
                            .membership(updated)
                            .permission(p)
                            .build());
                }
            }
        }

        return updated;
    }

    @Override
    @Transactional
    public void toggleMembershipActive(UUID propertyId, UUID membershipId, boolean isActive, UUID actorUserId) {
        MembershipTbl membership = membershipCrudService.findById(membershipId)
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
        membershipCrudService.save(membership);
    }

    @Override
    @Transactional
    public void removeMembership(UUID propertyId, UUID membershipId, UUID actorUserId) {
        MembershipTbl membership = membershipCrudService.findById(membershipId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Membership not found"));
        
        if (!propertyId.equals(membership.getPropertyId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Membership does not belong to this property");
        }

        if (membership.isFullAccess()) {
            ensureNotDemotingLastFullAccess(propertyId, membership.getId());
        }

        membershipPermissionCrudService.deleteByMembershipId(membership.getId());
        membershipCrudService.delete(membership);
    }

    @Override
    @Transactional
    public void transferOwnership(UUID propertyId, UUID currentOwnerId, UUID toUserId) {
        userFacade.getUserById(toUserId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Target owner user not found"));

        Optional<MembershipTbl> toUserMembershipOpt = membershipCrudService.findByUserIdAndPropertyId(toUserId, propertyId);
        if (toUserMembershipOpt.isPresent()) {
            MembershipTbl m = toUserMembershipOpt.get();
            m.setAccessType(AccessType.FULL_ACCESS);
            m.setTitle("Owner");
            m.setActive(true);
            membershipCrudService.save(m);
        } else {
            MembershipTbl newMembership = MembershipTbl.builder()
                    .userId(toUserId)
                    .propertyId(propertyId)
                    .title("Owner")
                    .accessType(AccessType.FULL_ACCESS)
                    .isActive(true)
                    .assignedBy(currentOwnerId)
                    .build();
            membershipCrudService.save(newMembership);
        }
    }

    private void ensureNotDemotingLastFullAccess(UUID propertyId, UUID currentMembershipId) {
        List<MembershipTbl> fullAccessMembers = membershipCrudService.findByPropertyIdAndAccessType(propertyId, AccessType.FULL_ACCESS);
        long activeFullAccessCount = fullAccessMembers.stream()
                .filter(MembershipTbl::isActive)
                .filter(m -> !m.getId().equals(currentMembershipId))
                .count();
        if (activeFullAccessCount < 1) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot remove, deactivate, or demote the only active Full Access member on the property.");
        }
    }
}
