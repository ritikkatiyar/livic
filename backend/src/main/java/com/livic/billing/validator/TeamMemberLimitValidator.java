package com.livic.billing.validator;

import com.livic.auth.facade.AuthFacade;
import com.livic.common.subscription.FeatureKey;
import com.livic.billing.dto.UserSubscriptionContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class TeamMemberLimitValidator implements SubscriptionValidator {

    private final AuthFacade authFacade;

    @Override
    public boolean validate(UUID userId, UserSubscriptionContext context) {
        int maxMembers = context.getLimit(FeatureKey.MAX_TEAM_MEMBERS);
        if (maxMembers == -1) {
            return true; // Unlimited
        }

        int currentMembers = authFacade.getMembershipsByUserId(userId).size();
        log.info("[TEAM MEMBER LIMIT CHECK] User: {}, Current Members: {}, Max Allowed: {}", userId, currentMembers, maxMembers);
        return currentMembers < maxMembers;
    }

    @Override
    public FeatureKey getSupportedFeature() {
        return FeatureKey.MAX_TEAM_MEMBERS;
    }
}
