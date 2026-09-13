package com.livic.billing.validator;

import com.livic.common.subscription.FeatureKey;
import com.livic.billing.dto.UserSubscriptionContext;

import java.util.UUID;

public interface SubscriptionValidator {
    boolean validate(UUID userId, UserSubscriptionContext context);
    FeatureKey getSupportedFeature();
}
