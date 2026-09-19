package com.livic.platform.subscription;

import com.livic.platform.subscription.domain.SaasSubscriptionTbl;
import com.livic.platform.subscription.repository.SaasSubscriptionRepository;
import com.livic.platform.subscription.repository.SubscriptionPlanRepository;

import java.time.LocalDateTime;
import java.util.UUID;

/** Seeds an active plan subscription so fixtures are not constrained by STARTER limits. */
public final class SubscriptionTestSupport {

    public static final UUID BASIC_PLAN_ID = UUID.fromString("10000000-0000-0000-0000-000000000002");
    public static final UUID ENTERPRISE_PLAN_ID = UUID.fromString("10000000-0000-0000-0000-000000000004");

    private SubscriptionTestSupport() {
    }

    public static void subscribe(SaasSubscriptionRepository subscriptionRepository,
                                 SubscriptionPlanRepository planRepository,
                                 UUID userId,
                                 UUID planId) {
        subscriptionRepository.save(SaasSubscriptionTbl.builder()
                .userId(userId)
                .plan(planRepository.findById(planId).orElseThrow())
                .status("ACTIVE")
                .currentPeriodStart(LocalDateTime.now().minusDays(1))
                .currentPeriodEnd(LocalDateTime.now().plusDays(29))
                .build());
    }
}
