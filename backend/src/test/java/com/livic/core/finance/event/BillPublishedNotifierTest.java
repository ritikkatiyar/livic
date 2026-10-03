package com.livic.core.finance.event;

import com.livic.core.finance.domain.BillType;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.interfaces.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/** A published bill is announced in words that fit it, on every channel, and only to a payer with an account. */
@ExtendWith(MockitoExtension.class)
class BillPublishedNotifierTest {

    @Mock private NotificationService notificationService;
    @InjectMocks private BillPublishedNotifier notifier;

    private final UUID payerId = UUID.randomUUID();

    private BillPublishedEvent event(BillType type, UUID payer) {
        return new BillPublishedEvent(UUID.randomUUID(), type, payer, "2026-09", BigDecimal.valueOf(25000), LocalDate.of(2026, 9, 10));
    }

    @Test
    @DisplayName("A tenant's rent bill is announced as rent on email, push and WhatsApp")
    void rentBillOnEveryChannel() {
        notifier.handle(event(BillType.RENT, payerId));

        verify(notificationService).send(eq(payerId.toString()), eq(NotificationChannel.EMAIL), contains("Rent Statement"), contains("25,000.00"));
        verify(notificationService).send(eq(payerId.toString()), eq(NotificationChannel.PUSH), contains("Rent Statement"), contains("Your rent of INR 25,000.00"));
        verify(notificationService).send(eq(payerId.toString()), eq(NotificationChannel.WHATSAPP), contains("Rent Statement"), contains("10 Sep 2026"));
    }

    @Test
    @DisplayName("An owner's maintenance bill is never called rent")
    void maintenanceBillIsNotRent() {
        notifier.handle(event(BillType.MAINTENANCE, payerId));

        verify(notificationService).send(eq(payerId.toString()), eq(NotificationChannel.EMAIL), contains("Maintenance Bill"), contains("maintenance bill"));
        verify(notificationService).send(eq(payerId.toString()), eq(NotificationChannel.PUSH), contains("Maintenance Bill"), contains("Your maintenance of INR"));
        verify(notificationService, never()).send(any(), any(), contains("Rent"), any());
    }

    @Test
    @DisplayName("One channel failing does not stop the others")
    void continuesWhenOneChannelFails() {
        doThrow(new RuntimeException("email down")).when(notificationService)
                .send(eq(payerId.toString()), eq(NotificationChannel.EMAIL), any(), any());

        notifier.handle(event(BillType.RENT, payerId));

        verify(notificationService).send(eq(payerId.toString()), eq(NotificationChannel.PUSH), any(), any());
        verify(notificationService).send(eq(payerId.toString()), eq(NotificationChannel.WHATSAPP), any(), any());
    }

    @Test
    @DisplayName("A payer without an account is not sent anything, and the event is not even queued for them")
    void payerWithoutAccountIsSkipped() {
        assertThat(notifier.accepts(event(BillType.RENT, null))).isFalse();
        assertThat(notifier.accepts(event(BillType.RENT, payerId))).isTrue();
    }

    @Test
    @DisplayName("Notices go out in the background, not in the request that published the bill")
    void sentInTheBackground() {
        assertThat(notifier.delivery()).isEqualTo(com.livic.platform.outbox.spi.OutboxConsumer.Delivery.BACKGROUND);
    }
}
