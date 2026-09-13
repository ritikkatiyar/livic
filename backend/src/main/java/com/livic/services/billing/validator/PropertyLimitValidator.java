package com.livic.services.billing.validator;

import com.livic.platform.common.subscription.FeatureKey;
import com.livic.services.billing.dto.UserSubscriptionContext;
import com.livic.services.property.facade.PropertyFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import org.slf4j.MDC;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class PropertyLimitValidator implements SubscriptionValidator {

    private final PropertyFacade propertyFacade;

    @Override
    public boolean validate(UUID userId, UserSubscriptionContext context) {
        int maxProperties = context.getLimit(FeatureKey.MAX_PROPERTIES);
        if (maxProperties == -1) {
            return true; // Unlimited
        }

        long currentPropertyCount = propertyFacade.getPropertiesByUserId(userId, Pageable.unpaged()).getTotalElements();
        
        log.atInfo()
                .setMessage("[PROPERTY LIMIT CHECK]")
                .addKeyValue("userId", userId)
                .addKeyValue("currentProperties", currentPropertyCount)
                .addKeyValue("maxAllowed", maxProperties)
                .addKeyValue("correlationId", MDC.get("correlationId"))
                .addKeyValue("traceId", MDC.get("traceId"))
                .addKeyValue("spanId", MDC.get("spanId"))
                .log();

        return currentPropertyCount < maxProperties;
    }

    @Override
    public FeatureKey getSupportedFeature() {
        return FeatureKey.MAX_PROPERTIES;
    }
}
