package com.livic.core.finance.specification;

import com.livic.core.finance.domain.RentCycleStatus;
import com.livic.core.finance.domain.RentCycleTbl;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collection;
import java.util.UUID;

public class RentCycleSpecifications {

    private RentCycleSpecifications() {
        // Private constructor to prevent instantiation
    }

    public static Specification<RentCycleTbl> hasLeaseId(UUID leaseId) {
        return (root, query, cb) -> leaseId == null
                ? null
                : cb.equal(root.get("lease").get("id"), leaseId);
    }

    public static Specification<RentCycleTbl> hasBillingMonth(String billingMonth) {
        return (root, query, cb) -> billingMonth == null
                ? null
                : cb.equal(root.get("billingMonth"), billingMonth);
    }

    public static Specification<RentCycleTbl> hasStatus(RentCycleStatus status) {
        return (root, query, cb) -> status == null
                ? null
                : cb.equal(root.get("status"), status);
    }

    public static Specification<RentCycleTbl> hasUnitIdIn(Collection<UUID> unitIds) {
        return (root, query, cb) -> {
            if (unitIds == null || unitIds.isEmpty()) {
                return cb.disjunction();
            }
            return root.get("lease").get("unitId").in(unitIds);
        };
    }

    public static Specification<RentCycleTbl> matchesSearch(Collection<UUID> matchingUnitIds, Collection<UUID> matchingUserIds) {
        return (root, query, cb) -> {
            boolean hasUnits = matchingUnitIds != null && !matchingUnitIds.isEmpty();
            boolean hasUsers = matchingUserIds != null && !matchingUserIds.isEmpty();

            if (!hasUnits && !hasUsers) {
                return cb.disjunction();
            }

            if (hasUnits && hasUsers) {
                return cb.or(
                        root.get("lease").get("unitId").in(matchingUnitIds),
                        root.get("lease").get("userId").in(matchingUserIds)
                );
            } else if (hasUnits) {
                return root.get("lease").get("unitId").in(matchingUnitIds);
            } else {
                return root.get("lease").get("userId").in(matchingUserIds);
            }
        };
    }

    public static Specification<RentCycleTbl> hasStatusNot(RentCycleStatus status) {
        return (root, query, cb) -> status == null
                ? null
                : cb.notEqual(root.get("status"), status);
    }
}
