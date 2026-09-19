package com.livic.core.finance.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

import java.math.BigDecimal;

@Entity
@Table(name = "meter_reading_tbl", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"unit_id", "charge_config_id", "billing_month", "billing_year"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeterReadingTbl extends BaseEntity {

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;
 
    @Column(name = "unit_id", nullable = false)
    private UUID unitId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "charge_config_id", nullable = false)
    @ToString.Exclude
    private ChargeConfigTbl chargeConfig;

    @Column(name = "billing_month", nullable = false)
    private Integer billingMonth;

    @Column(name = "billing_year", nullable = false)
    private Integer billingYear;

    @Column(name = "previous_reading", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal previousReading = BigDecimal.ZERO;

    @Column(name = "current_reading", precision = 10, scale = 2)
    private BigDecimal currentReading;

    @Column(name = "is_billed", nullable = false)
    @Builder.Default
    private Boolean isBilled = false;
}
