package com.livic.platform.subscription.service.impl;

import com.livic.platform.subscription.domain.SaasSubscriptionTbl;
import com.livic.platform.subscription.repository.SaasSubscriptionRepository;
import com.livic.platform.subscription.service.interfaces.SaasSubscriptionCrudService;
import com.livic.platform.common.service.impl.AbstractCrudService;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class SaasSubscriptionCrudServiceImpl
        extends AbstractCrudService<SaasSubscriptionTbl, UUID, SaasSubscriptionRepository>
        implements SaasSubscriptionCrudService {

    public SaasSubscriptionCrudServiceImpl(SaasSubscriptionRepository repository) {
        super(repository);
    }

    @Override
    public Optional<SaasSubscriptionTbl> findByUserIdAndStatus(UUID userId, String status) {
        return repository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, status);
    }

    @Override
    public Optional<SaasSubscriptionTbl> findLatestByUserId(UUID userId) {
        return repository.findFirstByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public Optional<SaasSubscriptionTbl> findLatestByUserIdAndStatus(UUID userId, String status) {
        return repository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, status);
    }
}
