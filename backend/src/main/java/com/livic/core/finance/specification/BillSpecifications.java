package com.livic.core.finance.specification;

import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.domain.BillTbl;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collection;
import java.util.UUID;

/**
 * Filters over bills.
 *
 * <p>A bill carries its property and its payer, and nothing else to filter on: it has no
 * lease, no unit and no user. Callers that start from a unit, a user or a lease resolve those
 * to unit members first, which is also the only path that works for an owner's maintenance
 * bill, since an owner has no lease at all.
 */
public class BillSpecifications {

    private BillSpecifications() {
        // Private constructor to prevent instantiation
    }

    public static Specification<BillTbl> hasMemberId(UUID memberId) {
        return (root, query, cb) -> memberId == null
                ? null
                : cb.equal(root.get("memberId"), memberId);
    }

    public static Specification<BillTbl> hasMemberIdIn(Collection<UUID> memberIds) {
        return (root, query, cb) -> {
            if (memberIds == null || memberIds.isEmpty()) {
                return cb.disjunction();
            }
            return root.get("memberId").in(memberIds);
        };
    }

    public static Specification<BillTbl> hasPropertyIdIn(Collection<UUID> propertyIds) {
        return (root, query, cb) -> {
            if (propertyIds == null || propertyIds.isEmpty()) {
                return cb.disjunction();
            }
            return root.get("propertyId").in(propertyIds);
        };
    }

    public static Specification<BillTbl> hasBillingMonth(String billingMonth) {
        return (root, query, cb) -> billingMonth == null
                ? null
                : cb.equal(root.get("billingMonth"), billingMonth);
    }

    public static Specification<BillTbl> hasStatus(BillStatus status) {
        return (root, query, cb) -> status == null
                ? null
                : cb.equal(root.get("status"), status);
    }

    public static Specification<BillTbl> hasStatusNot(BillStatus status) {
        return (root, query, cb) -> status == null
                ? null
                : cb.notEqual(root.get("status"), status);
    }
}
