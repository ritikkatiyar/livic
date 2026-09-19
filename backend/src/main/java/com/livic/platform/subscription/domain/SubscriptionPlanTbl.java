package com.livic.platform.subscription.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "subscription_plan_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlanTbl extends BaseEntity {

    @Column(name = "plan_key", nullable = false, unique = true, length = 50)
    private String planKey;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "price_monthly", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceMonthly;

    @Column(name = "price_yearly", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceYearly;

    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "USD";

    @Column(name = "gateway_plan_id_monthly")
    private String gatewayPlanIdMonthly;

    @Column(name = "gateway_plan_id_yearly")
    private String gatewayPlanIdYearly;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    public String getIdString() {
        return getId() != null ? getId().toString() : null;
    }
}
