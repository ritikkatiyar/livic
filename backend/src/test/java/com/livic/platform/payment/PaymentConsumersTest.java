package com.livic.platform.payment;

import com.livic.core.finance.listener.FinancePaymentEventListener;
import com.livic.platform.outbox.spi.OutboxConsumer;
import com.livic.platform.payment.event.PaymentCompletedEvent;
import com.livic.platform.subscription.listener.BillingPaymentEventListener;
import com.livic.verticals.marketplace.listener.MarketplacePaymentEventListener;
import com.livic.verticals.rental.booking.listener.BookingPaymentEventListener;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/** A completed payment reaches only the module that took it; the others never get a row for it. */
class PaymentConsumersTest {

    private final List<OutboxConsumer<PaymentCompletedEvent>> consumers = List.of(
            new FinancePaymentEventListener(null, null, null),
            new BillingPaymentEventListener(null, null, null),
            new MarketplacePaymentEventListener(null, null),
            new BookingPaymentEventListener(null));

    @Test
    @DisplayName("Each reference type is taken by exactly one consumer")
    void eachReferenceTypeHasOneConsumer() {
        Map<String, Set<String>> takenBy = Map.of(
                "BILL", Set.of("finance.bill-payment"),
                "SAAS_SUBSCRIPTION", Set.of("subscription.payment"),
                "WALLET_TOPUP", Set.of("subscription.payment"),
                "MARKETPLACE_LEAD", Set.of("marketplace.lead-payment"),
                "UNIT_BOOKING", Set.of("rental.booking-payment"),
                "SOMETHING_NEW", Set.of());

        takenBy.forEach((referenceType, expected) -> {
            PaymentCompletedEvent event = PaymentCompletedEvent.builder()
                    .transactionId(UUID.randomUUID()).referenceType(referenceType).referenceId(UUID.randomUUID()).build();
            Set<String> accepting = consumers.stream().filter(c -> c.accepts(event))
                    .map(OutboxConsumer::name).collect(Collectors.toSet());
            assertThat(accepting).as(referenceType).isEqualTo(expected);
        });
    }

    @Test
    @DisplayName("Consumer names are unique; they are stored on waiting events")
    void namesAreUnique() {
        assertThat(consumers.stream().map(OutboxConsumer::name).distinct()).hasSize(consumers.size());
    }
}
