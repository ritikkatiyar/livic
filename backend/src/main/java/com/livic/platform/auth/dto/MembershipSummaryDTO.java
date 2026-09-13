package com.livic.platform.auth.dto;

import com.livic.platform.common.enums.AccessType;
import java.util.UUID;

public record MembershipSummaryDTO(
        UUID id,
        UUID propertyId,
        String propertyName,
        UUID userId,
        String title,
        AccessType accessType,
        boolean isActive
) {}
