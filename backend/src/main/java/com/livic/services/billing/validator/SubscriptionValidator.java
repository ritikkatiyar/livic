package com.livic.services.billing.validator;

import com.livic.platform.common.subscription.FeatureKey;
import com.livic.services.billing.dto.UserSubscriptionContext;

import java.util.UUID;

public interface SubscriptionValidator {
    boolean validate(UUID userId, UserSubscriptionContext context);
    FeatureKey getSupportedFeature();
}
