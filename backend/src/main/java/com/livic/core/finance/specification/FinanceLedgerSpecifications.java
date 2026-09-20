package com.livic.core.finance.specification;

import com.livic.core.finance.domain.FinanceLedgerTbl;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.core.property.domain.UnitTbl;
import com.livic.platform.user.domain.UserTbl;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.UUID;

public class FinanceLedgerSpecifications {

    private FinanceLedgerSpecifications() {
        // Private constructor to prevent instantiation
    }

    public static Specification<FinanceLedgerTbl> hasPropertyId(UUID propertyId) {
        return (root, query, cb) -> {
            if (propertyId == null) {
                return null;
            }
            jakarta.persistence.criteria.Subquery<UUID> subquery = query.subquery(UUID.class);
            jakarta.persistence.criteria.Root<com.livic.core.property.domain.UnitTbl> unitRoot = subquery.from(com.livic.core.property.domain.UnitTbl.class);
            subquery.select(unitRoot.get("id"));
            subquery.where(cb.equal(unitRoot.get("property").get("id"), propertyId));

            return cb.in(root.get("unitId")).value(subquery);
        };
    }

    public static Specification<FinanceLedgerTbl> createdAfter(LocalDateTime fromDate) {
        return (root, query, cb) -> fromDate == null
                ? null
                : cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate);
    }

    public static Specification<FinanceLedgerTbl> createdBefore(LocalDateTime toDate) {
        return (root, query, cb) -> toDate == null
                ? null
                : cb.lessThanOrEqualTo(root.get("createdAt"), toDate);
    }

    public static Specification<FinanceLedgerTbl> searchStringFields(String search) {
        return (root, query, cb) -> {
            if (search == null || search.trim().isEmpty()) {
                return null;
            }
            String pattern = "%" + search.trim().toLowerCase() + "%";

            Subquery<UUID> unitSubquery = query.subquery(UUID.class);
            Root<UnitTbl> unitRoot = unitSubquery.from(UnitTbl.class);
            unitSubquery.select(unitRoot.get("id"));
            unitSubquery.where(cb.like(cb.lower(unitRoot.get("unitNumber")), pattern));

            Subquery<UUID> userSubquery = query.subquery(UUID.class);
            Root<UserTbl> userRoot = userSubquery.from(UserTbl.class);
            userSubquery.select(userRoot.get("id"));
            userSubquery.where(cb.like(cb.lower(userRoot.get("fullName")), pattern));

            Join<FinanceLedgerTbl, LeaseTbl> leaseJoin = root.join("lease", JoinType.LEFT);

            return cb.or(
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(root.get("transactionType").as(String.class)), pattern),
                    cb.in(root.get("unitId")).value(unitSubquery),
                    cb.in(leaseJoin.get("userId")).value(userSubquery)
            );
        };
    }
}
