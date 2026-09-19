package com.livic.platform.subscription.validator;

import com.livic.platform.common.subscription.FeatureKey;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class SubscriptionValidatorRegistry {

    private final Map<FeatureKey, SubscriptionValidator> validators = new HashMap<>();

    public SubscriptionValidatorRegistry(List<SubscriptionValidator> validatorList) {
        for (SubscriptionValidator validator : validatorList) {
            if (validator.getSupportedFeature() != null) {
                validators.put(validator.getSupportedFeature(), validator);
            }
        }
    }

    public SubscriptionValidator getValidator(FeatureKey feature) {
        return validators.get(feature);
    }
}
