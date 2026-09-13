package com.livic.services.finance.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "billing_worksheet_entry_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingWorksheetEntryTbl extends BaseEntity {

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "unit_id", nullable = false)
    private UUID unitId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "charge_config_id", nullable = false)
    @ToString.Exclude
    private ChargeConfigTbl chargeConfig;

    @Column(name = "billing_month", length = 7, nullable = false)
    private String billingMonth;

    @Column(name = "entered_value", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal enteredValue = BigDecimal.ZERO;

    @Column(name = "is_billed", nullable = false)
    @Builder.Default
    private Boolean isBilled = false;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;
}
