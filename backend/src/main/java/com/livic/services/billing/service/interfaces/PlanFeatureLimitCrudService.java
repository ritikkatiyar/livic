package com.livic.services.billing.service.interfaces;

import com.livic.services.billing.domain.PlanFeatureLimitTbl;
import com.livic.platform.common.service.interfaces.CrudService;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlanFeatureLimitCrudService extends CrudService<PlanFeatureLimitTbl, UUID> {
    List<PlanFeatureLimitTbl> findByPlanId(String planId);
    List<PlanFeatureLimitTbl> findByPlanIdIn(List<String> planIds);
    Optional<PlanFeatureLimitTbl> findByPlanIdAndFeatureKey(String planId, String featureKey);
}
