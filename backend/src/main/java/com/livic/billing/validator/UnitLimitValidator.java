package com.livic.billing.validator;

import com.livic.common.subscription.FeatureKey;
import com.livic.billing.dto.UserSubscriptionContext;
import com.livic.property.dto.PropertySummaryDTO;
import com.livic.property.facade.PropertyFacade;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.livic.property.facade.UnitFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import org.slf4j.MDC;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class UnitLimitValidator implements SubscriptionValidator {

    private final PropertyFacade propertyFacade;
    private final UnitFacade unitFacade;

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

        Page<PropertySummaryDTO> propertiesPage = propertyFacade.getPropertiesByUserId(userId, Pageable.unpaged());
        List<UUID> propertyIds = propertiesPage.getContent().stream().map(PropertySummaryDTO::id).toList();
        long currentUnitCount = unitFacade.getTotalUnitsForPropertyIds(propertyIds);

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
