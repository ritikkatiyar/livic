package com.livic.billing.validator;

import com.livic.auth.facade.AuthFacade;
import com.livic.billing.dto.UserSubscriptionContext;
import com.livic.common.subscription.FeatureKey;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * MAX_TEAM_MEMBERS is per property and includes the owner (a limit of 1 means "owner only").
 * The owner's plan applies, not the plan of whoever is joining or inviting.
 * Not a {@link SubscriptionValidator}: it needs the property, which the annotation-based aspect does not have.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TeamMemberLimitValidator {

    private final AuthFacade authFacade;

    public boolean canAddMember(UUID propertyId, UUID ownerId, UserSubscriptionContext ownerContext) {
        int maxMembers = ownerContext.getLimit(FeatureKey.MAX_TEAM_MEMBERS);
        if (maxMembers == -1) {
            return true; // Unlimited
        }

        long activeMembers = authFacade.countMembershipsByPropertyId(propertyId);
        log.info("[TEAM MEMBER LIMIT CHECK] Property: {}, Owner: {}, Active Members: {}, Max Allowed: {}",
                propertyId, ownerId, activeMembers, maxMembers);
        return activeMembers + 1 <= maxMembers;
    }
}
