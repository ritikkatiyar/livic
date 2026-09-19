package com.livic.platform.subscription.service.interfaces;

import com.livic.platform.subscription.dto.UserSubscriptionContext;

import java.util.UUID;

public interface SubscriptionCacheService {

    /**
     * Retrieves the cached subscription context (plan + limits) for a user.
     * Uses @Cacheable for sub-millisecond lookups.
     */
    UserSubscriptionContext getUserSubscriptionContext(UUID userId);

    /**
     * Evicts the cached subscription context for a user.
     * Triggered on subscription upgrade, downgrade, or payment webhook.
     */
    void evictUserSubscriptionContext(UUID userId);
}
