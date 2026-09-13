package com.livic.services.billing.service.interfaces;

import com.livic.services.billing.domain.WalletTransactionTbl;
import com.livic.platform.common.service.interfaces.CrudService;

import java.util.List;
import java.util.UUID;

public interface WalletTransactionCrudService extends CrudService<WalletTransactionTbl, UUID> {
    List<WalletTransactionTbl> findByWalletIdOrderByCreatedAtDesc(UUID walletId);
    boolean existsByWalletIdAndReferenceId(UUID walletId, String referenceId);
}
