package com.livic.billing.service.impl;

import com.livic.common.subscription.FeatureKey;
import com.livic.billing.domain.PlanFeatureLimitTbl;
import com.livic.billing.domain.SaasSubscriptionTbl;
import com.livic.billing.domain.SubscriptionPlanTbl;
import com.livic.billing.dto.UserSubscriptionContext;
import com.livic.billing.service.interfaces.PlanFeatureLimitCrudService;
import com.livic.billing.service.interfaces.SaasSubscriptionCrudService;
import com.livic.billing.service.interfaces.SubscriptionCacheService;
import com.livic.billing.service.interfaces.SubscriptionPlanCrudService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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

    private final SaasSubscriptionCrudService subscriptionCrudService;
    private final SubscriptionPlanCrudService planCrudService;
    private final PlanFeatureLimitCrudService featureLimitCrudService;

    @Override
    @Cacheable(value = "userSubscription", key = "#userId")
    @Transactional(readOnly = true)
    public UserSubscriptionContext getUserSubscriptionContext(UUID userId) {
        log.info("[SUBSCRIPTION CACHE MISS] Building subscription context from DB for user: {}", userId);

        SaasSubscriptionTbl subscription = subscriptionCrudService.findByUserIdAndStatus(userId, "ACTIVE")
                .orElse(null);

        SubscriptionPlanTbl starterPlan = planCrudService.findAll().stream()
                .filter(p -> "STARTER".equalsIgnoreCase(p.getPlanKey()))
                .findFirst()
                .orElse(null);

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
        List<PlanFeatureLimitTbl> limitsList = featureLimitCrudService.findByPlanId(planId);
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

    @Override
    @CacheEvict(value = "userSubscription", key = "#userId")
    public void evictUserSubscriptionContext(UUID userId) {
        log.info("[SUBSCRIPTION CACHE EVICT] Evicting subscription cache for user: {}", userId);
    }
}
