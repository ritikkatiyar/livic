package com.livic.platform.subscription.service.impl;

import com.livic.platform.subscription.domain.BillingWalletTbl;
import com.livic.platform.subscription.repository.BillingWalletRepository;
import com.livic.platform.subscription.service.interfaces.BillingWalletCrudService;
import com.livic.platform.common.service.impl.AbstractCrudService;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class BillingWalletCrudServiceImpl
        extends AbstractCrudService<BillingWalletTbl, UUID, BillingWalletRepository>
        implements BillingWalletCrudService {

    public BillingWalletCrudServiceImpl(BillingWalletRepository repository) {
        super(repository);
    }

    @Override
    public Optional<BillingWalletTbl> findByUserId(UUID userId) {
        return repository.findByUserId(userId);
    }

    @Override
    public Optional<BillingWalletTbl> findByUserIdForUpdate(UUID userId) {
        return repository.findByUserIdForUpdate(userId);
    }
}
