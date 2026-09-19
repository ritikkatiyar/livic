package com.livic.platform.subscription.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "saas_subscription_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaasSubscriptionTbl extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlanTbl plan;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "billing_cycle", nullable = false, length = 20)
    @Builder.Default
    private String billingCycle = "MONTHLY";

    @Column(name = "current_period_start", nullable = false)
    private LocalDateTime currentPeriodStart;

    @Column(name = "current_period_end", nullable = false)
    private LocalDateTime currentPeriodEnd;

    @Column(name = "auto_renew", nullable = false)
    @Builder.Default
    private Boolean autoRenew = true;

    @Column(name = "gateway_type", nullable = false, length = 30)
    @Builder.Default
    private String gatewayType = "RAZORPAY";

    @Column(name = "gateway_subscription_id")
    private String gatewaySubscriptionId;

    @Column(name = "gateway_customer_id")
    private String gatewayCustomerId;

    public String getPlanId() {
        return (plan != null && plan.getId() != null) ? plan.getId().toString() : null;
    }

    public String getPlanName() {
        return plan != null ? plan.getPlanKey() : "STARTER";
    }
}
