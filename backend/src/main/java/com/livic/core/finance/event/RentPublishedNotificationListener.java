package com.livic.core.finance.event;

import com.livic.platform.common.event.RentPublishedEvent;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
@Slf4j
public class RentPublishedNotificationListener {

    private static final String DEFAULT_RENT_STATEMENT_TITLE = "Rent Statement Published";
    private static final String CURRENCY_PATTERN = "#,##0.00";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");

    private final NotificationService notificationService;

    @EventListener
    public void onRentPublished(RentPublishedEvent event) {
        String tenantUserId = event.getTenantUserId().toString();
        String billingMonth = event.getBillingMonth();
        String formattedAmount = formatCurrency(event.getTotalAmount());
        String formattedDueDate = formatDate(event.getDueDate());

        log.info("Sending rent published notifications to tenant: {} for cycle: {}", tenantUserId, event.getBillId());

        String emailTitle = "New Rent Statement Published";
        String emailBody = String.format(
                "Dear Tenant, your rent statement for %s has been published. Total Amount Due: INR %s. Due Date: %s. Please pay online via the app.",
                billingMonth, formattedAmount, formattedDueDate
        );

        String pushTitle = DEFAULT_RENT_STATEMENT_TITLE;
        String pushBody = String.format(
                "Your rent of INR %s for %s is ready. Due: %s. Tap to view and pay.",
                formattedAmount, billingMonth, formattedDueDate
        );

        String whatsappTitle = DEFAULT_RENT_STATEMENT_TITLE;
        String whatsappBody = String.format(
                "Dear Tenant, your rent statement for %s has been published. Total Amount Due: INR %s. Due Date: %s. Please pay online via the Livic app.",
                billingMonth, formattedAmount, formattedDueDate
        );

        dispatchNotification(tenantUserId, NotificationChannel.EMAIL, emailTitle, emailBody);
        dispatchNotification(tenantUserId, NotificationChannel.PUSH, pushTitle, pushBody);
        dispatchNotification(tenantUserId, NotificationChannel.WHATSAPP, whatsappTitle, whatsappBody);
    }

    private void dispatchNotification(String userId, NotificationChannel channel, String title, String body) {
        try {
            notificationService.send(userId, channel, title, body);
            log.info("Successfully dispatched rent statement {} to user: {}", channel, userId);
        } catch (Exception e) {
            log.error("Failed to send rent statement {} to user: {}", channel, userId, e);
        }
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) {
            return "0.00";
        }
        return new DecimalFormat(CURRENCY_PATTERN).format(amount);
    }

    private String formatDate(LocalDate date) {
        if (date == null) {
            return "";
        }
        return date.format(DATE_FORMATTER);
    }
}
