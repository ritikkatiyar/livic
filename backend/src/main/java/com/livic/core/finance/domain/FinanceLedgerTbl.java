package com.livic.core.finance.domain;

import com.livic.platform.common.domain.BaseEntity;
import com.livic.platform.common.domain.LedgerTransactionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "finance_ledger_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinanceLedgerTbl extends BaseEntity {

    @Column(name = "unit_id", nullable = false)
    private UUID unitId;

    /** The payer this entry belongs to; balances are per member as well as per unit. */
    @Column(name = "member_id")
    private UUID memberId;

    /**
     * Kept as a plain id, not a relation: leases move to the rental vertical, and a core
     * table must not hold a mapping to one. Owner entries have no lease at all.
     */
    @Column(name = "lease_id")
    private UUID leaseId;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private LedgerTransactionType transactionType;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "balance", nullable = false, precision = 10, scale = 2)
    private BigDecimal balance;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "description")
    private String description;
}
