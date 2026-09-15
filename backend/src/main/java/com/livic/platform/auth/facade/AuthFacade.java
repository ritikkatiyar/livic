package com.livic.platform.auth.facade;

import com.livic.platform.auth.dto.MembershipSummaryDTO;
import com.livic.platform.common.enums.AccessType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface AuthFacade {

    List<MembershipSummaryDTO> getMembershipsByUserId(UUID userId);

    List<MembershipSummaryDTO> getMembershipsByPropertyId(UUID propertyId);

    Page<MembershipSummaryDTO> getMembershipsByPropertyId(UUID propertyId, Pageable pageable);

    /** Active memberships only; inactive members do not occupy a seat. */
    long countMembershipsByPropertyId(UUID propertyId);

    /**
     * The property owner: the active Full Access membership titled "Owner" (most recently assigned, e.g. after a
     * transfer), otherwise the earliest active Full Access member.
     */
    Optional<UUID> findPropertyOwnerId(UUID propertyId);

    void createOwnerMembership(UUID propertyId, UUID userId);

    boolean existsByUserIdAndPropertyId(UUID userId, UUID propertyId);

    MembershipSummaryDTO createMembership(UUID propertyId, UUID userId, String title, AccessType accessType, Set<String> permissionCodes, UUID assignedByUserId);

    MembershipSummaryDTO updateMembership(UUID propertyId, UUID membershipId, String title, AccessType accessType, Boolean isActive, Set<String> permissionCodes, UUID actorUserId);

    void toggleMembershipActive(UUID propertyId, UUID membershipId, boolean active, UUID actorId);

    void removeMembership(UUID propertyId, UUID membershipId, UUID actorId);

    void transferOwnership(UUID propertyId, UUID currentOwnerId, UUID toUserId);

    Set<String> getMembershipPermissions(UUID membershipId);

    Map<UUID, Set<String>> getPermissionsByMembershipIds(Collection<UUID> membershipIds);

    /**
     * Effective staff permission codes per property for the user's active memberships. FULL_ACCESS memberships
     * resolve to every {@link com.livic.platform.common.constant.StaffPermission} code.
     */
    Map<UUID, Set<String>> getEffectivePermissionCodes(UUID userId);
}
