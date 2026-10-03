package com.livic.core.finance.event;

import com.livic.core.finance.domain.BillType;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.interfaces.NotificationService;
import com.livic.platform.outbox.spi.OutboxConsumer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Tells a payer their bill is out, by email, push and WhatsApp, in words that fit the bill: rent for
 * a tenant, maintenance for an owner. A payer without an account is not sent anything.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BillPublishedNotifier implements OutboxConsumer<BillPublishedEvent> {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);

    private final NotificationService notificationService;

    @Override
    public String name() {
        return "finance.bill-published-notice";
    }

    @Override
    public Class<BillPublishedEvent> eventType() {
        return BillPublishedEvent.class;
    }

    @Override
    public Delivery delivery() {
        // Sending messages is slow; the request that caused them should not wait.
        return Delivery.BACKGROUND;
    }

    @Override
    public boolean accepts(BillPublishedEvent event) {
        return event.payerUserId() != null;
    }

    @Override
    public void handle(BillPublishedEvent event) {
        String userId = event.payerUserId().toString();
        String what = event.billType() == BillType.MAINTENANCE ? "maintenance" : "rent";
        String month = event.billingMonth();
        String amount = formatCurrency(event.totalAmount());
        String due = formatDate(event.dueDate());

        String title = event.billType() == BillType.MAINTENANCE ? "Maintenance Bill Published" : "Rent Statement Published";
        String statement = String.format("Your %s bill for %s has been published. Total amount due: INR %s. Due date: %s.",
                what, month, amount, due);

        send(userId, NotificationChannel.EMAIL, title, statement + " Please pay online via the app.");
        send(userId, NotificationChannel.PUSH, title,
                String.format("Your %s of INR %s for %s is ready. Due: %s. Tap to view and pay.", what, amount, month, due));
        send(userId, NotificationChannel.WHATSAPP, title, statement + " Please pay online via the Livic app.");
    }

    /** One channel failing must not stop the others, nor send them twice on a retry. */
    private void send(String userId, NotificationChannel channel, String title, String body) {
        try {
            notificationService.send(userId, channel, title, body);
        } catch (Exception e) {
            log.error("Failed to send bill notice by {} to user {}", channel, userId, e);
        }
    }

    private static String formatCurrency(BigDecimal amount) {
        return amount == null ? "0.00" : new DecimalFormat("#,##0.00").format(amount);
    }

    private static String formatDate(LocalDate date) {
        return date == null ? "" : date.format(DATE_FORMATTER);
    }
}
