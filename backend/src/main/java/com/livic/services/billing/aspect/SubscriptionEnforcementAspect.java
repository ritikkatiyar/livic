package com.livic.services.billing.aspect;

import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.common.subscription.EnforceSubscription;
import com.livic.platform.common.subscription.FeatureKey;
import com.livic.services.billing.dto.UserSubscriptionContext;
import com.livic.services.billing.service.interfaces.SubscriptionCacheService;
import com.livic.services.billing.validator.SubscriptionValidator;
import com.livic.services.billing.validator.SubscriptionValidatorRegistry;
import com.livic.platform.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionEnforcementAspect {

    private final SubscriptionCacheService subscriptionCacheService;
    private final SubscriptionValidatorRegistry validatorRegistry;

    @Before("@annotation(enforceSubscription)")
    public void enforce(JoinPoint joinPoint, EnforceSubscription enforceSubscription) {
        FeatureKey feature = enforceSubscription.feature();
        UUID ownerId = currentUserId();

        if (ownerId == null) {
            log.error("[SUBSCRIPTION ENFORCEMENT] Could not resolve owner ID for feature check: {}", feature);
            throw new BusinessException(HttpStatus.FORBIDDEN, "Unable to verify subscription — action denied");
        }

        SubscriptionValidator validator = validatorRegistry.getValidator(feature);
        if (validator == null) {
            log.error("[SUBSCRIPTION ENFORCEMENT] No validator registered for feature key: {}", feature);
            throw new BusinessException(HttpStatus.FORBIDDEN, "No subscription validator registered for feature: " + feature);
        }

        // Sub-millisecond lookup from in-memory cache
        UserSubscriptionContext context = subscriptionCacheService.getUserSubscriptionContext(ownerId);
        boolean allowed = validator.validate(ownerId, context);

        log.info("[SUBSCRIPTION ASPECT] User: {}, Feature: {}, Plan: {}, Allowed: {}",
                ownerId, feature, context.getPlanKey(), allowed);

        if (!allowed) {
            throw limitReached(feature, context.getPlanKey());
        }
    }

    public static BusinessException limitReached(FeatureKey feature, String planKey) {
        return new BusinessException(
                HttpStatus.FORBIDDEN,
                String.format("Feature '%s' limit reached or not included in your '%s' plan. Please upgrade your subscription plan to access this capability.",
                        feature.name(), planKey)
        );
    }

    public static UUID currentUserId() {
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if (principal instanceof UserDetailsImpl) {
                return UUID.fromString(((UserDetailsImpl) principal).getId());
            }
        } catch (Exception e) {
            log.debug("Authentication not available in SecurityContextHolder");
        }
        return null;
    }
}
