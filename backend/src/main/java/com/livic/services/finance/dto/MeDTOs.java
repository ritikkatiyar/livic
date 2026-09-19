package com.livic.services.finance.dto;

import com.livic.platform.auth.dto.MembershipSummaryDTO;
import com.livic.platform.common.domain.UserRole;
import com.livic.platform.common.enums.AccessType;
import com.livic.services.property.domain.UnitMemberRole;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class MeDTOs {

    public record MyContextResponse(
            UserRole globalRole,
            List<MembershipSummary> managedProperties,
            List<MembershipSummary> tenantProperties,
            List<ActiveLeaseSummary> activeLeases,
            boolean isLandlord,
            boolean isTenant,
            List<UnitMembershipSummary> unitMemberships
    ) {
        public static MyContextResponse build(
                UserRole globalRole,
                List<MembershipSummary> managedProperties,
                List<MembershipSummary> tenantProperties,
                List<ActiveLeaseSummary> activeLeases,
                List<UnitMembershipSummary> unitMemberships
        ) {
            return new MyContextResponse(
                    globalRole,
                    managedProperties,
                    tenantProperties,
                    activeLeases,
                    !managedProperties.isEmpty(),
                    !activeLeases.isEmpty(),
                    unitMemberships
            );
        }
    }

    /** A unit this person belongs to, as owner, tenant or family member. */
    public record UnitMembershipSummary(
            UUID memberId,
            UUID unitId,
            String unitNumber,
            Integer floor,
            UUID propertyId,
            String propertyName,
            UnitMemberRole role,
            UUID leaseId
    ) {}

    public record MembershipSummary(
            UUID propertyId,
            String propertyName,
            String title,
            AccessType accessType,
            Set<String> permissionCodes
    ) {
        public static MembershipSummary from(MembershipSummaryDTO membership, Set<String> permissionCodes) {
            return new MembershipSummary(
                    membership.propertyId(),
                    membership.propertyName(),
                    membership.title(),
                    membership.accessType(),
                    permissionCodes
            );
        }
    }

    public record ActiveLeaseSummary(
            UUID leaseId,
            UUID propertyId,
            String propertyName,
            UUID unitId,
            String unitNumber,
            BigDecimal rentAmount,
            String status
    ) {
        public static ActiveLeaseSummary from(LeaseSummaryDTO lease) {
            return new ActiveLeaseSummary(
                    lease.id(),
                    lease.propertyId(),
                    lease.propertyName(),
                    lease.unitId(),
                    lease.unitNumber(),
                    lease.rentAmount(),
                    lease.status()
            );
        }
    }
}
