package com.livic.services.billing.service.interfaces;

import com.livic.services.billing.dto.PlanResponse;

import java.util.List;

public interface SubscriptionPlanQueryService {
    List<PlanResponse> getAllActivePlans();
}
