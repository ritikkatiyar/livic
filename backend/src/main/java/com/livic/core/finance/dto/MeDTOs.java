package com.livic.core.finance.dto;

import com.livic.platform.auth.dto.MembershipSummaryDTO;
import com.livic.platform.common.domain.UserRole;
import com.livic.platform.common.enums.AccessType;
import com.livic.core.property.domain.UnitMemberRole;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class MeDTOs {

    public record MyContextResponse(
            UserRole globalRole,
            List<MembershipSummary> managedProperties,
            List<MembershipSummary> tenantProperties,
            boolean isLandlord,
            boolean isTenant,
            List<UnitMembershipSummary> unitMemberships
    ) {
        public static MyContextResponse build(
                UserRole globalRole,
                List<MembershipSummary> managedProperties,
                List<MembershipSummary> tenantProperties,
                List<UnitMembershipSummary> unitMemberships
        ) {
            // Being a tenant is a unit membership, not a lease. An owner renting their own
            // flat out is a landlord here and a tenant nowhere.
            boolean tenant = unitMemberships.stream()
                    .anyMatch(m -> m.role() == UnitMemberRole.TENANT);
            return new MyContextResponse(
                    globalRole,
                    managedProperties,
                    tenantProperties,
                    !managedProperties.isEmpty(),
                    tenant,
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
        /** auth cannot see property names, so the caller supplies it. */
        public static MembershipSummary from(MembershipSummaryDTO membership, String propertyName, Set<String> permissionCodes) {
            return new MembershipSummary(
                    membership.propertyId(),
                    propertyName,
                    membership.title(),
                    membership.accessType(),
                    permissionCodes
            );
        }
    }

}
