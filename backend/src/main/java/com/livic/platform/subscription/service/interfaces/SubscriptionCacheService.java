package com.livic.platform.subscription.service.interfaces;

import com.livic.platform.subscription.dto.UserSubscriptionContext;

import java.util.UUID;

public interface SubscriptionCacheService {

    /** The user's current plan and its feature limits, read from the database. */
    UserSubscriptionContext getUserSubscriptionContext(UUID userId);

}
