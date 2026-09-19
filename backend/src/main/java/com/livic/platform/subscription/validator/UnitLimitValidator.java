package com.livic.platform.subscription.validator;

import com.livic.platform.common.subscription.FeatureKey;
import com.livic.platform.subscription.dto.UserSubscriptionContext;
import com.livic.platform.subscription.spi.PropertyUsageProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import org.slf4j.MDC;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class UnitLimitValidator implements SubscriptionValidator {

    private final PropertyUsageProvider propertyUsageProvider;

    @Override
    public boolean validate(UUID userId, UserSubscriptionContext context) {
        return canAddUnits(userId, context, 1);
    }

    /** True when the user's existing units plus {@code additionalUnits} stay within the plan limit. */
    public boolean canAddUnits(UUID userId, UserSubscriptionContext context, int additionalUnits) {
        int maxUnits = context.getLimit(FeatureKey.MAX_UNITS);
        if (maxUnits == -1) {
            return true; // Unlimited
        }

        long currentUnitCount = propertyUsageProvider.countUnitsForUser(userId);

        log.atInfo()
                .setMessage("[UNIT LIMIT CHECK]")
                .addKeyValue("userId", userId)
                .addKeyValue("currentUnits", currentUnitCount)
                .addKeyValue("additionalUnits", additionalUnits)
                .addKeyValue("maxAllowed", maxUnits)
                .addKeyValue("correlationId", MDC.get("correlationId"))
                .addKeyValue("traceId", MDC.get("traceId"))
                .addKeyValue("spanId", MDC.get("spanId"))
                .log();

        return currentUnitCount + additionalUnits <= maxUnits;
    }

    @Override
    public FeatureKey getSupportedFeature() {
        return FeatureKey.MAX_UNITS;
    }
}
