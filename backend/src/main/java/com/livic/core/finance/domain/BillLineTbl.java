package com.livic.core.finance.domain;

import com.livic.platform.common.domain.BaseEntity;
import com.livic.platform.common.domain.RentChargeType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * One charge on a bill.
 *
 * <p>Lines are frozen at generation: {@code amount}, {@code taxRate}, {@code taxAmount} and
 * the description are copied from the charge config and never re-derived from it at render
 * time. {@code customChargeConfig} is there for traceability only. Otherwise editing a
 * charge config would silently rewrite last month's invoice, which is exactly what gapless
 * numbering is supposed to prevent.
 */
@Entity
@Table(name = "bill_line_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillLineTbl extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id", nullable = false)
    @ToString.Exclude
    private BillTbl bill;

    @Enumerated(EnumType.STRING)
    @Column(name = "charge_type", nullable = false, length = 50)
    private RentChargeType chargeType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /** Percentage, frozen at generation. Societies crossing the GST threshold must charge it. */
    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxRate = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "charge_config_id")
    @ToString.Exclude
    private ChargeConfigTbl customChargeConfig;
}
