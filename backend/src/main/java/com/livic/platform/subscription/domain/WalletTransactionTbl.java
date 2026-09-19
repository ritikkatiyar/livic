package com.livic.platform.subscription.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "wallet_transaction_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletTransactionTbl extends BaseEntity {

    @Column(name = "wallet_id", nullable = false)
    private UUID walletId;

    @Column(name = "amount", nullable = false, precision = 10, scale = 4)
    private BigDecimal amount;

    @Column(name = "transaction_type", nullable = false, length = 10)
    private String transactionType; // CREDIT, DEBIT

    @Column(name = "reason", nullable = false, length = 100)
    private String reason;

    @Column(name = "reference_id")
    private String referenceId;
}
