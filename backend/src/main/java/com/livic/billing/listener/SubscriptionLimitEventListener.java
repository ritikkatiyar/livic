package com.livic.billing.listener;

import com.livic.auth.facade.AuthFacade;
import com.livic.billing.aspect.SubscriptionEnforcementAspect;
import com.livic.billing.dto.UserSubscriptionContext;
import com.livic.billing.service.interfaces.SubscriptionCacheService;
import com.livic.billing.validator.TeamMemberLimitValidator;
import com.livic.billing.validator.UnitLimitValidator;
import com.livic.common.event.MemberSeatRequestedEvent;
import com.livic.common.event.UnitsCreationRequestedEvent;
import com.livic.common.subscription.FeatureKey;
import com.livic.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Enforces plan limits that need request details the annotation-based aspect cannot see:
 * how many units a request creates, and which property (and so which owner's plan) a member joins.
 * Runs synchronously inside the publisher's transaction; throwing rejects the operation.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionLimitEventListener {

    private final SubscriptionCacheService subscriptionCacheService;
    private final UnitLimitValidator unitLimitValidator;
    private final TeamMemberLimitValidator teamMemberLimitValidator;
    private final AuthFacade authFacade;

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

    @EventListener
    public void onMemberSeatRequested(MemberSeatRequestedEvent event) {
        UUID ownerId = authFacade.findPropertyOwnerId(event.getPropertyId())
                .orElseThrow(() -> new BusinessException(HttpStatus.FORBIDDEN, "Unable to verify subscription — action denied"));

        UserSubscriptionContext ownerContext = subscriptionCacheService.getUserSubscriptionContext(ownerId);
        if (!teamMemberLimitValidator.canAddMember(event.getPropertyId(), ownerId, ownerContext)) {
            log.info("[SUBSCRIPTION LIMIT] Property: {}, Owner: {}, Feature: MAX_TEAM_MEMBERS, Plan: {}, Allowed: false",
                    event.getPropertyId(), ownerId, ownerContext.getPlanKey());
            throw SubscriptionEnforcementAspect.limitReached(FeatureKey.MAX_TEAM_MEMBERS, ownerContext.getPlanKey());
        }
    }
}
