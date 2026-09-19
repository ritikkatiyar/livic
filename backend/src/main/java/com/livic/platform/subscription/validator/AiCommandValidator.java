package com.livic.platform.subscription.validator;

import com.livic.platform.common.subscription.FeatureKey;
import com.livic.platform.subscription.dto.UserSubscriptionContext;
import com.livic.platform.subscription.service.interfaces.BillingWalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiCommandValidator implements SubscriptionValidator {

    private final BillingWalletService billingWalletService;

    @Override
    public boolean validate(UUID userId, UserSubscriptionContext context) {
        int monthlyCredits = context.getLimit(FeatureKey.AI_CREDITS_MONTHLY);
        if (monthlyCredits == -1) {
            return true; // Unlimited AI credits for Enterprise
        }

        // Check if user has at least 1 credit available in their prepaid/allocated wallet
        boolean hasBalance = billingWalletService.hasBalance(userId, 1.0);
        log.info("[AI CREDIT VALIDATOR] User: {}, Monthly Limit: {}, Has Balance: {}", userId, monthlyCredits, hasBalance);
        return hasBalance;
    }

    @Override
    public FeatureKey getSupportedFeature() {
        return FeatureKey.AI_CREDITS_MONTHLY;
    }
}
