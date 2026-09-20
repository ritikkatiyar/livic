package com.livic.core.finance.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * One payer, one issuer, one month.
 *
 * <p>A rental RENT bill is payable by the tenant member and issued by the property. A
 * residential MAINTENANCE bill is payable by the owner member. When an owner rents their
 * flat out, the RENT bill is payable by the tenant and {@code issuedByMemberId} names the
 * owner — which is what makes the two-layer case explicit rather than inferred.
 *
 * <p>There is deliberately no {@code leaseId} here. The payer member already carries one,
 * so rental answers "bills for lease X" through {@code unit_member}; a second path would
 * drift, and a rental foreign key has no business in a core table.
 */
@Entity
@Table(name = "bill_tbl", uniqueConstraints = {
        @UniqueConstraint(name = "uk_bill_member_month_type",
                columnNames = {"member_id", "billing_month", "bill_type"}),
        @UniqueConstraint(name = "uk_bill_property_invoice_no",
                columnNames = {"property_id", "invoice_no"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
public class BillTbl extends BaseEntity {

    /**
     * Denormalised from {@code member -> unit -> property}. It is what the rent roll filters
     * on and what scopes {@code invoice_no}; a unit never changes property, so it cannot drift.
     */
    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    /** The unit member who owes this bill. */
    @Column(name = "member_id", nullable = false)
    private UUID memberId;

    /** The member who issued it; null means the property itself issued it. */
    @Column(name = "issued_by_member_id")
    private UUID issuedByMemberId;

    @Enumerated(EnumType.STRING)
    @Column(name = "bill_type", nullable = false, length = 32)
    private BillType billType;

    /**
     * {@code yyyy-MM} for recurring bills, null for ad-hoc ones. Null is what keeps the
     * unique key from blocking them: InnoDB treats NULLs as distinct in a unique index, so
     * recurring bills stay protected against double generation while ad-hoc bills are free.
     */
    @Column(name = "billing_month", length = 7)
    private String billingMonth;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private BillStatus status;

    /** Gapless per property per financial year; assigned when the bill is published. */
    @Column(name = "invoice_no", length = 32)
    private String invoiceNo;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "amount_paid", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal amountPaid = BigDecimal.ZERO;
}
