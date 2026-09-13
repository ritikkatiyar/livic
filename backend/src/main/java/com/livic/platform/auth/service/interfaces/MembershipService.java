package com.livic.platform.auth.service.interfaces;

import com.livic.platform.auth.domain.MembershipTbl;
import com.livic.platform.common.enums.AccessType;

import java.util.Set;
import java.util.UUID;

public interface MembershipService {
    void createOwnerMembership(UUID propertyId, UUID ownerId);
    
    MembershipTbl createMembership(UUID propertyId, UUID userId, String title, AccessType accessType, Set<String> permissionCodes, UUID assignedByUserId);

    MembershipTbl updateMembership(UUID propertyId, UUID membershipId, String title, AccessType accessType, Boolean isActive, Set<String> permissionCodes, UUID actorUserId);

    void toggleMembershipActive(UUID propertyId, UUID membershipId, boolean isActive, UUID actorUserId);

    void removeMembership(UUID propertyId, UUID membershipId, UUID actorUserId);
    
    void transferOwnership(UUID propertyId, UUID currentOwnerId, UUID toUserId);
}
