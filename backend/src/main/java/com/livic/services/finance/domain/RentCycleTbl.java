package com.livic.services.finance.domain;

import com.livic.platform.common.domain.BaseEntity;
import com.livic.services.finance.domain.RentCycleStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "rent_cycle_tbl", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"lease_id", "billing_month"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
public class RentCycleTbl extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lease_id", nullable = false)
    @ToString.Exclude
    private LeaseTbl lease;

    @Column(name = "billing_month", length = 7, nullable = false)
    private String billingMonth;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RentCycleStatus status;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "amount_paid", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(name = "payment_transaction_id")
    private UUID paymentTransactionId;
}
