package com.livic.platform.subscription.service.impl;

import com.livic.platform.subscription.domain.SubscriptionPlanTbl;
import com.livic.platform.subscription.repository.SubscriptionPlanRepository;
import com.livic.platform.subscription.service.interfaces.SubscriptionPlanCrudService;
import com.livic.platform.common.service.impl.AbstractCrudService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class SubscriptionPlanCrudServiceImpl
        extends AbstractCrudService<SubscriptionPlanTbl, UUID, SubscriptionPlanRepository>
        implements SubscriptionPlanCrudService {

    public SubscriptionPlanCrudServiceImpl(SubscriptionPlanRepository repository) {
        super(repository);
    }

    @Override
    public Optional<SubscriptionPlanTbl> findByPlanKey(String planKey) {
        return repository.findByPlanKey(planKey);
    }

    @Override
    public List<SubscriptionPlanTbl> findByIsActiveTrue() {
        return repository.findByIsActiveTrue();
    }
}
