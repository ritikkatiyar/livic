package com.livic.platform.payment.service.impl;

import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.platform.payment.domain.PaymentTransactionTbl;
import com.livic.platform.payment.repository.PaymentTransactionRepository;
import com.livic.platform.payment.service.interfaces.PaymentTransactionCrudService;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentTransactionCrudServiceImpl
        extends AbstractCrudService<PaymentTransactionTbl, UUID, PaymentTransactionRepository>
        implements PaymentTransactionCrudService {

    public PaymentTransactionCrudServiceImpl(PaymentTransactionRepository repository) {
        super(repository);
    }

    @Override
    public Optional<PaymentTransactionTbl> findByGatewayTransactionId(String gatewayTransactionId) {
        return repository.findByGatewayTransactionId(gatewayTransactionId);
    }
}
