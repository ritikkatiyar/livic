package com.livic.platform.payment.service.interfaces;

import com.livic.platform.common.service.interfaces.CrudService;
import com.livic.platform.payment.domain.PaymentTransactionTbl;

import java.util.Optional;
import java.util.UUID;

public interface PaymentTransactionCrudService extends CrudService<PaymentTransactionTbl, UUID> {
    Optional<PaymentTransactionTbl> findByGatewayTransactionId(String gatewayTransactionId);
}
