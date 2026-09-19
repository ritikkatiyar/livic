package com.livic.platform.subscription.validator;

import com.livic.platform.common.subscription.FeatureKey;
import com.livic.platform.subscription.dto.UserSubscriptionContext;

import java.util.UUID;

public interface SubscriptionValidator {
    boolean validate(UUID userId, UserSubscriptionContext context);
    FeatureKey getSupportedFeature();
}
