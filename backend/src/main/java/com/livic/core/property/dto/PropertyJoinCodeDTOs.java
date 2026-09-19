package com.livic.core.property.dto;

import com.livic.platform.common.enums.AccessType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public class PropertyJoinCodeDTOs {

    public record GenerateJoinCodeRequest(
            String title,
            AccessType accessType,
            Set<String> permissionCodes,
            @NotNull Integer maxUses
    ) {}

    public record ValidateJoinCodeRequest(
            @NotBlank String code
    ) {}

    public record JoinCodeResponse(
            UUID id,
            String code,
            String title,
            AccessType accessType,
            int maxUses,
            int usesCount,
            boolean isActive,
            Instant expiresAt,
            Set<String> permissionCodes
    ) {}

    public record JoinCodeResultResponse(
            UUID propertyId,
            String propertyName,
            String title,
            AccessType accessType,
            UUID membershipId
    ) {}
}
