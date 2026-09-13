package com.livic.platform.payment.service.interfaces;

import com.livic.platform.common.service.interfaces.CrudService;
import com.livic.platform.payment.domain.PaymentWebhookEventTbl;

import java.util.UUID;

public interface PaymentWebhookEventCrudService extends CrudService<PaymentWebhookEventTbl, UUID> {
    boolean existsByEventId(String eventId);
}
