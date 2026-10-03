package com.livic.platform.outbox.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.livic.platform.outbox.domain.OutboxEventTbl;
import com.livic.platform.outbox.domain.OutboxStatus;
import com.livic.platform.outbox.repository.OutboxEventRepository;
import com.livic.platform.outbox.spi.OutboxConsumer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Hands waiting events to their consumers: right after the publisher commits for immediate
 * consumers, and from a poller for background ones and for retries. Each delivery claims its row
 * with SKIP LOCKED and runs the consumer and the row update in one transaction, so a consumer's
 * effect and "done" commit together and no event is handled twice, even across instances.
 */
@Slf4j
@Component
public class OutboxDelivery {

    static final int MAX_ATTEMPTS = 10;
    private static final Duration FIRST_RETRY = Duration.ofSeconds(30);
    private static final Duration LONGEST_WAIT = Duration.ofHours(1);
    /** An immediate event left undelivered (the process stopped after the commit) is polled after this. */
    public static final Duration IMMEDIATE_GRACE = Duration.ofMinutes(1);
    private static final int BATCH = 100;

    private final Map<String, OutboxConsumer<?>> consumersByName = new HashMap<>();
    private final List<OutboxConsumer<?>> consumers;
    private final OutboxEventRepository repository;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate newTransaction;

    public OutboxDelivery(ObjectProvider<OutboxConsumer<?>> consumerBeans, OutboxEventRepository repository,
                          ObjectMapper objectMapper, PlatformTransactionManager transactionManager) {
        List<OutboxConsumer<?>> consumers = consumerBeans.orderedStream().toList();
        for (OutboxConsumer<?> consumer : consumers) {
            if (consumersByName.putIfAbsent(consumer.name(), consumer) != null) {
                throw new IllegalStateException("Two outbox consumers are named " + consumer.name());
            }
        }
        this.consumers = List.copyOf(consumers);
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.newTransaction = new TransactionTemplate(transactionManager);
        this.newTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /** The consumers that want this event. */
    @SuppressWarnings("unchecked")
    public List<OutboxConsumer<?>> consumersOf(Object event) {
        return consumers.stream()
                .filter(c -> c.eventType().isInstance(event) && ((OutboxConsumer<Object>) c).accepts(event))
                .toList();
    }

    /** Delivers one waiting event; a failure is recorded on the row for a later retry, never thrown. */
    public void deliver(UUID eventId) {
        try {
            newTransaction.executeWithoutResult(tx -> repository.claim(eventId.toString()).ifPresent(this::handle));
        } catch (RuntimeException e) {
            log.warn("Outbox event {} failed: {}", eventId, e.toString());
            newTransaction.executeWithoutResult(tx -> repository.findById(eventId).ifPresent(row -> recordFailure(row, e)));
        }
    }

    @Scheduled(fixedDelayString = "${app.outbox.poll-interval-ms:5000}",
            initialDelayString = "${app.outbox.poll-interval-ms:5000}")
    public void deliverDue() {
        List<UUID> due = repository.findDueIds(LocalDateTime.now(), PageRequest.of(0, BATCH));
        due.forEach(this::deliver);
    }

    /** Delivered events are kept a week for tracing, then removed. */
    @Scheduled(cron = "${app.outbox.cleanup-cron:0 30 3 * * *}")
    public void deleteDelivered() {
        Integer removed = newTransaction.execute(tx -> repository.deleteDoneBefore(LocalDateTime.now().minusDays(7)));
        log.info("Removed {} delivered outbox events", removed);
    }

    @SuppressWarnings("unchecked")
    private void handle(OutboxEventTbl row) {
        OutboxConsumer<Object> consumer = (OutboxConsumer<Object>) consumersByName.get(row.getConsumer());
        if (consumer == null) {
            throw new IllegalStateException("No outbox consumer is named " + row.getConsumer());
        }
        Object event;
        try {
            event = objectMapper.readValue(row.getPayload(), consumer.eventType());
        } catch (Exception e) {
            throw new IllegalStateException("Cannot read " + row.getEventType() + " for " + row.getConsumer(), e);
        }
        consumer.handle(event);
        row.setAttempts(row.getAttempts() + 1);
        row.setStatus(OutboxStatus.DONE);
        row.setLastError(null);
    }

    private void recordFailure(OutboxEventTbl row, RuntimeException error) {
        if (row.getStatus() != OutboxStatus.PENDING) {
            return;
        }
        int attempts = row.getAttempts() + 1;
        row.setAttempts(attempts);
        String message = error.getMessage() != null ? error.getMessage() : error.toString();
        row.setLastError(message.length() > 1000 ? message.substring(0, 1000) : message);
        if (attempts >= MAX_ATTEMPTS) {
            row.setStatus(OutboxStatus.FAILED);
            log.error("Outbox event {} for {} gave up after {} attempts: {}", row.getId(), row.getConsumer(), attempts, message);
        } else {
            row.setNextAttemptAt(LocalDateTime.now().plus(backoff(attempts)));
        }
    }

    /** 30 s, 1 min, 2 min, doubling, at most an hour. */
    static Duration backoff(int attempts) {
        Duration wait = FIRST_RETRY.multipliedBy(1L << Math.min(attempts - 1, 20));
        return wait.compareTo(LONGEST_WAIT) > 0 ? LONGEST_WAIT : wait;
    }
}
