package com.livic.platform.outbox.facade.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.livic.platform.outbox.domain.OutboxEventTbl;
import com.livic.platform.outbox.domain.OutboxStatus;
import com.livic.platform.outbox.facade.OutboxFacade;
import com.livic.platform.outbox.repository.OutboxEventRepository;
import com.livic.platform.outbox.service.impl.OutboxDelivery;
import com.livic.platform.outbox.spi.OutboxConsumer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OutboxFacadeImpl implements OutboxFacade {

    private final OutboxDelivery delivery;
    private final OutboxEventRepository repository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void publish(Object event) {
        List<OutboxConsumer<?>> consumers = delivery.consumersOf(event);
        if (consumers.isEmpty()) {
            return;
        }
        String payload;
        try {
            payload = objectMapper.writeValueAsString(event);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Cannot store " + event.getClass().getName() + " as JSON", e);
        }

        LocalDateTime now = LocalDateTime.now();
        List<UUID> deliverAfterCommit = new ArrayList<>();
        for (OutboxConsumer<?> consumer : consumers) {
            boolean immediate = consumer.delivery() == OutboxConsumer.Delivery.IMMEDIATE;
            OutboxEventTbl row = repository.save(OutboxEventTbl.builder()
                    .eventType(event.getClass().getName())
                    .consumer(consumer.name())
                    .payload(payload)
                    .status(OutboxStatus.PENDING)
                    .attempts(0)
                    // An immediate event is delivered after the commit below; the poller is only its safety net.
                    .nextAttemptAt(immediate ? now.plus(OutboxDelivery.IMMEDIATE_GRACE) : now)
                    .build());
            if (immediate) {
                deliverAfterCommit.add(row.getId());
            }
        }

        if (!deliverAfterCommit.isEmpty()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    deliverAfterCommit.forEach(delivery::deliver);
                }
            });
        }
    }
}
