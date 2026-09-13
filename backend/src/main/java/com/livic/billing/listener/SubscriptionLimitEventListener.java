package com.livic.billing.listener;

import com.livic.billing.annotation.FeatureKey;
import com.livic.billing.aspect.SubscriptionEnforcementAspect;
import com.livic.billing.dto.UserSubscriptionContext;
import com.livic.billing.service.interfaces.SubscriptionCacheService;
import com.livic.billing.validator.UnitLimitValidator;
import com.livic.common.event.UnitsCreationRequestedEvent;
import com.livic.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Enforces plan limits that depend on how much a request creates, which the annotation-based aspect cannot see.
 * Runs synchronously inside the publisher's transaction; throwing rejects the operation.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionLimitEventListener {

    private final SubscriptionCacheService subscriptionCacheService;
    private final UnitLimitValidator unitLimitValidator;

    @EventListener
    public void onUnitsCreationRequested(UnitsCreationRequestedEvent event) {
        UUID userId = SubscriptionEnforcementAspect.currentUserId();
        if (userId == null) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Unable to verify subscription — action denied");
        }

        UserSubscriptionContext context = subscriptionCacheService.getUserSubscriptionContext(userId);
        if (!unitLimitValidator.canAddUnits(userId, context, event.getAdditionalUnits())) {
            log.info("[SUBSCRIPTION LIMIT] User: {}, Feature: MAX_UNITS, Plan: {}, AdditionalUnits: {}, Allowed: false",
                    userId, context.getPlanKey(), event.getAdditionalUnits());
            throw SubscriptionEnforcementAspect.limitReached(FeatureKey.MAX_UNITS, context.getPlanKey());
        }
    }
}
