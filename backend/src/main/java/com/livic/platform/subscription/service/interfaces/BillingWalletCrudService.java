package com.livic.platform.subscription.service.interfaces;

import com.livic.platform.subscription.domain.BillingWalletTbl;
import com.livic.platform.common.service.interfaces.CrudService;

import java.util.Optional;
import java.util.UUID;

public interface BillingWalletCrudService extends CrudService<BillingWalletTbl, UUID> {
    Optional<BillingWalletTbl> findByUserId(UUID userId);

    Optional<BillingWalletTbl> findByUserIdForUpdate(UUID userId);
}
