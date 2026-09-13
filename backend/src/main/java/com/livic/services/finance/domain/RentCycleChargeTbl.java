package com.livic.services.finance.domain;

import com.livic.platform.common.domain.BaseEntity;
import com.livic.platform.common.domain.RentChargeType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "rent_cycle_charge_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentCycleChargeTbl extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rent_cycle_id", nullable = false)
    @ToString.Exclude
    private RentCycleTbl rentCycle;

    @Enumerated(EnumType.STRING)
    @Column(name = "charge_type", nullable = false, length = 50)
    private RentChargeType chargeType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "charge_config_id")
    @ToString.Exclude
    private ChargeConfigTbl customChargeConfig;
}
