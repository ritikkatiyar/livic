package com.livic.platform.subscription.service.impl;

import com.livic.platform.subscription.domain.PlanFeatureLimitTbl;
import com.livic.platform.subscription.domain.SubscriptionPlanTbl;
import com.livic.platform.subscription.dto.PlanResponse;
import com.livic.platform.subscription.service.interfaces.PlanFeatureLimitCrudService;
import com.livic.platform.subscription.service.interfaces.SubscriptionPlanCrudService;
import com.livic.platform.subscription.service.interfaces.SubscriptionPlanQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionPlanQueryServiceImpl implements SubscriptionPlanQueryService {

    private final SubscriptionPlanCrudService planCrudService;
    private final PlanFeatureLimitCrudService featureLimitCrudService;

    @Override
    @Transactional(readOnly = true)
    public List<PlanResponse> getAllActivePlans() {
        List<SubscriptionPlanTbl> plans = planCrudService.findByIsActiveTrue();
        if (plans.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> planIds = plans.stream()
                .map(SubscriptionPlanTbl::getIdString)
                .filter(Objects::nonNull)
                .toList();

        List<PlanFeatureLimitTbl> activeLimits = featureLimitCrudService.findByPlanIdIn(planIds);
        Map<String, List<PlanFeatureLimitTbl>> limitsByPlanId = activeLimits.stream()
                .collect(Collectors.groupingBy(PlanFeatureLimitTbl::getPlanId));

        List<PlanResponse> responses = new ArrayList<>();
        for (SubscriptionPlanTbl plan : plans) {
            List<PlanFeatureLimitTbl> planLimits = limitsByPlanId.getOrDefault(plan.getIdString(), Collections.emptyList());
            List<PlanResponse.FeatureDisplayItem> displayItems = new ArrayList<>();

            for (PlanFeatureLimitTbl limit : planLimits) {
                String label = formatDisplayLabel(limit.getFeatureKey(), limit.getLimitValue());
                boolean included = limit.getLimitValue() != 0;

                displayItems.add(PlanResponse.FeatureDisplayItem.builder()
                        .featureKey(limit.getFeatureKey())
                        .displayLabel(label)
                        .limitValue(limit.getLimitValue())
                        .included(included)
                        .build());
            }

            responses.add(PlanResponse.builder()
                    .id(plan.getIdString())
                    .planKey(plan.getPlanKey())
                    .name(plan.getName())
                    .priceMonthly(plan.getPriceMonthly())
                    .priceYearly(plan.getPriceYearly())
                    .currency(plan.getCurrency())
                    .features(displayItems)
                    .build());
        }

        return responses;
    }

    private String formatDisplayLabel(String featureKey, int limitValue) {
        return switch (featureKey) {
            case "MAX_PROPERTIES" -> limitValue == -1 ? "Unlimited Properties" : (limitValue + " Propert" + (limitValue > 1 ? "ies" : "y"));
            case "MAX_UNITS" -> limitValue == -1 ? "Unlimited Units" : (limitValue + " Units");
            case "MAX_TEAM_MEMBERS" -> limitValue == 1 ? "Owner Only" : (limitValue == -1 ? "Unlimited Team" : (limitValue + " Team Members"));
            case "AI_CREDITS_MONTHLY" -> limitValue == -1 ? "Unlimited AI" : (limitValue + " AI Credits/mo");
            case "COMMAND_CENTER_3D" -> "3D Command Center";
            case "CUSTOM_CHARGE_TYPES" -> "Custom Charge Types";
            case "BATCH_RENT_GENERATION" -> "Batch Billing";
            case "BILLING_WORKSHEET" -> "Billing Worksheet";
            case "FINANCIAL_LEDGER" -> "Financial Ledger";
            case "PREMIUM_EXPENSE_SPLIT" -> "Custom Expense Splits";
            case "INVOICE_PDF" -> "PDF Invoices";
            case "CUSTOM_ROLES" -> "Custom Roles";
            case "FINE_GRAINED_PERMISSIONS" -> "Fine-Grained Permissions";
            case "TARGETED_ANNOUNCEMENTS" -> "Targeted Announcements";
            case "ADVANCED_ANALYTICS" -> "Analytics Dashboard";
            case "ADVANCED_REPORTS" -> "Advanced Reports";
            default -> featureKey;
        };
    }
}
