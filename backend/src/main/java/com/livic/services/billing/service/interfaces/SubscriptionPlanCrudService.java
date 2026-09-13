package com.livic.services.billing.service.interfaces;

import com.livic.services.billing.domain.SubscriptionPlanTbl;
import com.livic.platform.common.service.interfaces.CrudService;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionPlanCrudService extends CrudService<SubscriptionPlanTbl, UUID> {
    Optional<SubscriptionPlanTbl> findByPlanKey(String planKey);
    List<SubscriptionPlanTbl> findByIsActiveTrue();
}
