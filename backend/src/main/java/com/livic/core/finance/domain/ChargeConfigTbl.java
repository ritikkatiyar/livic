package com.livic.core.finance.domain;

import com.livic.platform.common.domain.BaseEntity;
import com.livic.core.finance.domain.BillingFrequency;
import com.livic.core.finance.domain.CalculationStrategyType;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

import java.math.BigDecimal;

@Entity
@Table(name = "charge_config_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChargeConfigTbl extends BaseEntity {

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "charge_name", nullable = false, length = 100)
    private String chargeName;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_frequency", nullable = false, length = 50)
    private BillingFrequency billingFrequency;

    @Enumerated(EnumType.STRING)
    @Column(name = "calculation_strategy", nullable = false, length = 50)
    private CalculationStrategyType calculationStrategy;

    @Column(name = "base_rate", precision = 10, scale = 2)
    private BigDecimal baseRate;

    @Column(name = "unit_type", length = 50)
    private String unitType;

    @Column(name = "apply_sales_tax", nullable = false)
    private Boolean applySalesTax;

    @Column(name = "late_fee_percentage", precision = 5, scale = 2)
    private BigDecimal lateFeePercentage;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "auto_carry_forward", nullable = false)
    @Builder.Default
    private Boolean autoCarryForward = false;
}
