package com.livic.services.finance.domain;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lease_id")
    @ToString.Exclude
    private LeaseTbl lease;

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
