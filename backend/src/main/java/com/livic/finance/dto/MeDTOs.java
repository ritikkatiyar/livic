package com.livic.finance.dto;

import com.livic.auth.dto.MembershipSummaryDTO;
import com.livic.common.domain.UserRole;
import com.livic.common.enums.AccessType;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class MeDTOs {

    public record MyContextResponse(
            UserRole globalRole,
            List<MembershipSummary> managedProperties,
            List<MembershipSummary> tenantProperties,
            List<ActiveLeaseSummary> activeLeases,
            boolean isLandlord,
            boolean isTenant
    ) {
        public static MyContextResponse build(
                UserRole globalRole,
                List<MembershipSummary> managedProperties,
                List<MembershipSummary> tenantProperties,
                List<ActiveLeaseSummary> activeLeases
        ) {
            return new MyContextResponse(
                    globalRole,
                    managedProperties,
                    tenantProperties,
                    activeLeases,
                    !managedProperties.isEmpty(),
                    !activeLeases.isEmpty()
            );
        }
    }

    public record MembershipSummary(
            UUID propertyId,
            String propertyName,
            String title,
            AccessType accessType
    ) {
        public static MembershipSummary from(MembershipSummaryDTO membership) {
            return new MembershipSummary(
                    membership.propertyId(),
                    membership.propertyName(),
                    membership.title(),
                    membership.accessType()
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
