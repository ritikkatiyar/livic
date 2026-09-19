package com.livic.core.property.dto;

import com.livic.core.property.domain.UnitMemberRole;

import java.util.UUID;

/**
 * An active member of a unit together with where that unit sits, so callers can target
 * a whole property, a floor or a single unit without looking units up themselves.
 */
public record UnitResidentDTO(
        UUID memberId,
        UUID userId,
        UnitMemberRole role,
        UUID leaseId,
        UUID unitId,
        String unitNumber,
        Integer floor,
        UUID propertyId
) {
}
