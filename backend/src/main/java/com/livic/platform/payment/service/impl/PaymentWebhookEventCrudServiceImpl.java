package com.livic.platform.payment.service.impl;

import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.platform.payment.domain.PaymentWebhookEventTbl;
import com.livic.platform.payment.repository.PaymentWebhookEventRepository;
import com.livic.platform.payment.service.interfaces.PaymentWebhookEventCrudService;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class PaymentWebhookEventCrudServiceImpl
        extends AbstractCrudService<PaymentWebhookEventTbl, UUID, PaymentWebhookEventRepository>
        implements PaymentWebhookEventCrudService {

    public PaymentWebhookEventCrudServiceImpl(PaymentWebhookEventRepository repository) {
        super(repository);
    }

    @Override
    public boolean existsByEventId(String eventId) {
        return repository.existsByGatewayEventId(eventId);
    }
}
