package com.livic.platform.outbox;

import com.livic.platform.outbox.domain.OutboxEventTbl;
import com.livic.platform.outbox.domain.OutboxStatus;
import com.livic.platform.outbox.facade.OutboxFacade;
import com.livic.platform.outbox.repository.OutboxEventRepository;
import com.livic.platform.outbox.service.impl.OutboxDelivery;
import com.livic.platform.outbox.spi.OutboxConsumer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The outbox delivers an event only if its publisher commits, to each consumer once, in its own
 * transaction: a failing consumer is retried without undoing the publisher or the other consumers.
 */
@SpringBootTest
@ActiveProfiles("dev")
// The poller is driven by hand here.
@TestPropertySource(properties = "app.outbox.poll-interval-ms=3600000")
class OutboxIntegrationTest {

    /** A test event; the marker keeps one test's events apart from another's. */
    record Ping(String marker, boolean failForFlaky) {
    }

    static final List<String> handled = new CopyOnWriteArrayList<>();

    @TestConfiguration
    static class Consumers {

        @Bean
        OutboxConsumer<Ping> recorder() {
            return consumer("test-recorder", OutboxConsumer.Delivery.IMMEDIATE, ping -> handled.add("recorder:" + ping.marker()));
        }

        @Bean
        OutboxConsumer<Ping> flaky() {
            return consumer("test-flaky", OutboxConsumer.Delivery.IMMEDIATE, ping -> {
                if (ping.failForFlaky()) {
                    throw new IllegalStateException("flaky is down");
                }
                handled.add("flaky:" + ping.marker());
            });
        }

        @Bean
        OutboxConsumer<Ping> background() {
            return consumer("test-background", OutboxConsumer.Delivery.BACKGROUND, ping -> handled.add("background:" + ping.marker()));
        }

        private static OutboxConsumer<Ping> consumer(String name, OutboxConsumer.Delivery delivery, java.util.function.Consumer<Ping> action) {
            return new OutboxConsumer<>() {
                @Override
                public String name() {
                    return name;
                }

                @Override
                public Class<Ping> eventType() {
                    return Ping.class;
                }

                @Override
                public Delivery delivery() {
                    return delivery;
                }

                @Override
                public void handle(Ping event) {
                    action.accept(event);
                }
            };
        }
    }

    @Autowired private OutboxFacade outboxFacade;
    @Autowired private OutboxDelivery outboxDelivery;
    @Autowired private OutboxEventRepository outboxEventRepository;
    @Autowired private PlatformTransactionManager transactionManager;

    private TransactionTemplate tx;
    private String marker;

    @BeforeEach
    void setUp() {
        tx = new TransactionTemplate(transactionManager);
        marker = UUID.randomUUID().toString();
        handled.clear();
    }

    @AfterEach
    void cleanUp() {
        outboxEventRepository.deleteAll(rowsFor(marker));
    }

    @Test
    @DisplayName("Immediate consumers run right after the commit; background ones wait for the poller")
    void deliveredAfterCommit() {
        tx.executeWithoutResult(s -> outboxFacade.publish(new Ping(marker, false)));

        assertThat(handled).containsExactlyInAnyOrder("recorder:" + marker, "flaky:" + marker);
        assertThat(statusOf("test-recorder")).isEqualTo(OutboxStatus.DONE);
        assertThat(statusOf("test-background")).isEqualTo(OutboxStatus.PENDING);

        outboxDelivery.deliverDue();

        assertThat(handled).contains("background:" + marker);
        assertThat(statusOf("test-background")).isEqualTo(OutboxStatus.DONE);
    }

    @Test
    @DisplayName("Nothing is delivered when the publisher's transaction rolls back")
    void rollbackDeliversNothing() {
        tx.executeWithoutResult(s -> {
            outboxFacade.publish(new Ping(marker, false));
            s.setRollbackOnly();
        });

        assertThat(handled).isEmpty();
        assertThat(rowsFor(marker)).isEmpty();
    }

    @Test
    @DisplayName("A failing consumer is retried later without affecting the others")
    void failingConsumerIsRetriedAlone() {
        tx.executeWithoutResult(s -> outboxFacade.publish(new Ping(marker, true)));

        assertThat(handled).containsExactly("recorder:" + marker);
        OutboxEventTbl flaky = rowFor("test-flaky");
        assertThat(flaky.getStatus()).isEqualTo(OutboxStatus.PENDING);
        assertThat(flaky.getAttempts()).isEqualTo(1);
        assertThat(flaky.getLastError()).contains("flaky is down");
        assertThat(flaky.getNextAttemptAt()).isAfter(java.time.LocalDateTime.now());
    }

    @Test
    @DisplayName("An event is handled once, even when delivered again")
    void deliveredOnce() {
        tx.executeWithoutResult(s -> outboxFacade.publish(new Ping(marker, false)));
        outboxDelivery.deliver(rowFor("test-recorder").getId());

        assertThat(handled).filteredOn(h -> h.equals("recorder:" + marker)).hasSize(1);
    }

    @Test
    @DisplayName("Publishing outside a transaction is refused, so an event can never outlive a rollback")
    void publishingNeedsATransaction() {
        assertThatThrownBy(() -> outboxFacade.publish(new Ping(marker, false)))
                .isInstanceOf(IllegalTransactionStateException.class);
    }

    private List<OutboxEventTbl> rowsFor(String marker) {
        return outboxEventRepository.findAll().stream().filter(r -> r.getPayload().contains(marker)).toList();
    }

    private OutboxEventTbl rowFor(String consumer) {
        return rowsFor(marker).stream().filter(r -> r.getConsumer().equals(consumer)).findFirst().orElseThrow();
    }

    private OutboxStatus statusOf(String consumer) {
        return rowFor(consumer).getStatus();
    }
}
