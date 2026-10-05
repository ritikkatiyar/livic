package com.livic.platform.subscription.listener;

import com.livic.platform.auth.facade.AuthFacade;
import com.livic.platform.subscription.aspect.SubscriptionEnforcementAspect;
import com.livic.platform.subscription.dto.UserSubscriptionContext;
import com.livic.platform.subscription.service.interfaces.SubscriptionCacheService;
import com.livic.platform.subscription.validator.TeamMemberLimitValidator;
import com.livic.platform.auth.event.MemberSeatRequestedEvent;
import com.livic.platform.common.subscription.FeatureKey;
import com.livic.platform.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Enforces the team-seat limit when auth adds a member to a property, against the plan of the
 * property's owner. Auth cannot call subscription, so it asks with an event; this runs inside its
 * transaction and throwing rejects the member.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionLimitEventListener {

    private final SubscriptionCacheService subscriptionCacheService;
    private final TeamMemberLimitValidator teamMemberLimitValidator;
    private final AuthFacade authFacade;

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
