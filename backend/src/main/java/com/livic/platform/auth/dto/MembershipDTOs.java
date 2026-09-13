package com.livic.platform.auth.dto;

import com.livic.platform.common.enums.AccessType;
import jakarta.validation.constraints.NotNull;
import java.util.Set;
import java.util.UUID;

public class MembershipDTOs {

    public record MembershipResponse(
            UUID id,
            UUID userId,
            String fullName,
            String email,
            String title,
            AccessType accessType,
            boolean isActive,
            Set<String> permissionCodes
    ) {}

    public record UpdateMembershipRequest(
            String title,
            AccessType accessType,
            Boolean isActive,
            Set<String> permissionCodes
    ) {}

    public record UpdateMembershipPermissionsRequest(
            @NotNull Set<String> permissionCodes
    ) {}

    public record TransferOwnershipRequest(
            @NotNull UUID toUserId
    ) {}
}
