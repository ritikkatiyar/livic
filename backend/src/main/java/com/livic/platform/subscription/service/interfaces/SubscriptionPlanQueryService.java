package com.livic.platform.subscription.service.interfaces;

import com.livic.platform.subscription.dto.PlanResponse;

import java.util.List;

public interface SubscriptionPlanQueryService {
    List<PlanResponse> getAllActivePlans();
}
