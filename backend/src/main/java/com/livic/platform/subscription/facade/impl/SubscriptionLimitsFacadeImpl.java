package com.livic.platform.subscription.facade.impl;

import com.livic.platform.auth.facade.AuthFacade;
import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.common.subscription.FeatureKey;
import com.livic.platform.subscription.aspect.SubscriptionEnforcementAspect;
import com.livic.platform.subscription.dto.UserSubscriptionContext;
import com.livic.platform.subscription.facade.SubscriptionLimitsFacade;
import com.livic.platform.subscription.service.interfaces.SubscriptionCacheService;
import com.livic.platform.subscription.validator.UnitLimitValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionLimitsFacadeImpl implements SubscriptionLimitsFacade {

    private final AuthFacade authFacade;
    private final SubscriptionCacheService subscriptionCacheService;
    private final UnitLimitValidator unitLimitValidator;

    @Override
    public void checkCanAddUnits(UUID propertyId, int additionalUnits) {
        if (additionalUnits <= 0) {
            return;
        }
        UUID ownerId = authFacade.findPropertyOwnerId(propertyId)
                .orElseThrow(() -> new BusinessException(HttpStatus.FORBIDDEN, "Unable to verify subscription — action denied"));

        UserSubscriptionContext context = subscriptionCacheService.getUserSubscriptionContext(ownerId);
        if (!unitLimitValidator.canAddUnits(ownerId, context, additionalUnits)) {
            log.info("[SUBSCRIPTION LIMIT] Property: {}, Owner: {}, Feature: MAX_UNITS, Plan: {}, AdditionalUnits: {}, Allowed: false",
                    propertyId, ownerId, context.getPlanKey(), additionalUnits);
            throw SubscriptionEnforcementAspect.limitReached(FeatureKey.MAX_UNITS, context.getPlanKey());
        }
    }
}
