package com.livic.core.finance.specification;

import com.livic.core.finance.domain.FinanceLedgerTbl;
import java.util.List;
import java.util.Collection;
import java.util.ArrayList;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.UUID;

public class FinanceLedgerSpecifications {

    private FinanceLedgerSpecifications() {
        // Private constructor to prevent instantiation
    }

    /** The property's units, resolved by the service rather than subqueried from here. */
    public static Specification<FinanceLedgerTbl> hasUnitIdIn(Collection<UUID> unitIds) {
        return (root, query, cb) -> {
            if (unitIds == null) {
                return null;
            }
            if (unitIds.isEmpty()) {
                return cb.disjunction();
            }
            return root.get("unitId").in(unitIds);
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

    /**
     * Free-text search over the ledger's own columns, plus whichever units and payers the
     * caller has already matched. The ids are resolved by the service through the property
     * facade: a finance query has no business selecting from another module's tables.
     */
    public static Specification<FinanceLedgerTbl> matchesSearch(
            String search, Collection<UUID> matchingUnitIds, Collection<UUID> matchingMemberIds) {
        return (root, query, cb) -> {
            if (search == null || search.trim().isEmpty()) {
                return null;
            }
            String pattern = "%" + search.trim().toLowerCase() + "%";

            List<Predicate> any = new ArrayList<>();
            any.add(cb.like(cb.lower(root.get("description")), pattern));
            any.add(cb.like(cb.lower(root.get("transactionType").as(String.class)), pattern));
            if (matchingUnitIds != null && !matchingUnitIds.isEmpty()) {
                any.add(root.get("unitId").in(matchingUnitIds));
            }
            if (matchingMemberIds != null && !matchingMemberIds.isEmpty()) {
                any.add(root.get("memberId").in(matchingMemberIds));
            }
            return cb.or(any.toArray(new Predicate[0]));
        };
    }
}
