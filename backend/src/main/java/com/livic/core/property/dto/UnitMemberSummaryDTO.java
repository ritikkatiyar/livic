package com.livic.core.property.dto;

import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.domain.UnitMemberTbl;

import java.time.LocalDate;
import java.util.UUID;

/** A person attached to a unit, as other modules see them. */
public record UnitMemberSummaryDTO(
        UUID id,
        UUID unitId,
        UUID userId,
        UnitMemberRole role,
        boolean isPrimary,
        UUID leaseId,
        LocalDate fromDate,
        LocalDate toDate,
        boolean isActive
) {
    public static UnitMemberSummaryDTO from(UnitMemberTbl member) {
        if (member == null) {
            return null;
        }
        return new UnitMemberSummaryDTO(
                member.getId(),
                member.getUnitId(),
                member.getUserId(),
                member.getRole(),
                member.isPrimary(),
                member.getLeaseId(),
                member.getFromDate(),
                member.getToDate(),
                member.isActive()
        );
    }
}
