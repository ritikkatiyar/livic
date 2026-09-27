package com.livic.platform.subscription.service.impl;

import com.livic.platform.subscription.repository.SubscriptionPlanRepository;
import com.livic.platform.subscription.repository.SaasSubscriptionRepository;
import com.livic.platform.subscription.repository.PlanFeatureLimitRepository;
import com.livic.platform.common.subscription.FeatureKey;
import com.livic.platform.subscription.domain.PlanFeatureLimitTbl;
import com.livic.platform.subscription.domain.SaasSubscriptionTbl;
import com.livic.platform.subscription.domain.SubscriptionPlanTbl;
import com.livic.platform.subscription.dto.UserSubscriptionContext;
import com.livic.platform.subscription.service.interfaces.SubscriptionCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionCacheServiceImpl implements SubscriptionCacheService {

    private final SaasSubscriptionRepository saasSubscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final PlanFeatureLimitRepository planFeatureLimitRepository;

    /**
     * Read fresh on every call. It used to sit in a cache that nothing ever evicted, so a user who
     * upgraded kept the starter plan's limits until a restart, and the cache grew by one entry per
     * user forever. It is only asked when a property, unit or team seat is added, so three small
     * queries per call cost nothing worth caching.
     */
    @Override
    @Transactional(readOnly = true)
    public UserSubscriptionContext getUserSubscriptionContext(UUID userId) {

        SaasSubscriptionTbl subscription = saasSubscriptionRepository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, "ACTIVE")
                .orElse(null);

        SubscriptionPlanTbl starterPlan = subscriptionPlanRepository.findByPlanKey("STARTER").orElse(null);

        String planId = starterPlan != null ? starterPlan.getIdString() : null;
        String planKey = "STARTER";

        if (subscription != null && subscription.getPlan() != null) {
            SubscriptionPlanTbl plan = subscription.getPlan();
            if (plan.getId() != null) {
                planId = plan.getIdString();
                planKey = plan.getPlanKey();
            }
        }

        // Fetch feature limits in a single query (0 N+1 queries)
        List<PlanFeatureLimitTbl> limitsList = planFeatureLimitRepository.findByPlanId(planId);
        Map<FeatureKey, Integer> limitsMap = new HashMap<>();

        for (PlanFeatureLimitTbl limit : limitsList) {
            try {
                FeatureKey key = FeatureKey.valueOf(limit.getFeatureKey());
                limitsMap.put(key, limit.getLimitValue());
            } catch (IllegalArgumentException e) {
                log.warn("[SUBSCRIPTION CACHE] Unknown feature key in DB: {}", limit.getFeatureKey());
            }
        }

        return UserSubscriptionContext.builder()
                .userId(userId)
                .planId(planId)
                .planKey(planKey)
                .featureLimits(limitsMap)
                .build();
    }

}
