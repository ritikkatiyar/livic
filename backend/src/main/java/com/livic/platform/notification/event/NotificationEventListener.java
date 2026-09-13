package com.livic.platform.notification.event;

import com.livic.platform.common.event.AnnouncementBroadcastEvent;
import com.livic.platform.common.event.EmailVerificationRequestedEvent;
import com.livic.platform.common.event.IssueCreatedEvent;
import com.livic.platform.common.event.IssueEscalatedEvent;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Asynchronous event listener for all notification-triggering events in the system.
 *
 * Design Patterns applied:
 * - Observer Pattern: This class observes Spring ApplicationEvents published by the
 *   issue and announcement modules without those modules having any direct dependency
 *   on the notification module. Full loose coupling.
 * - SRP: This class is solely responsible for intercepting events and delegating dispatch
 *   to NotificationService. No business logic lives here.
 * - @Async: Ensures notification dispatch never blocks the calling thread (e.g. the HTTP
 *   request that triggered an issue creation remains responsive).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;

    /**
     * Fires when a new issue is created.
     * Notifies the landlord / property manager about the new ticket.
     */
    @Async
    @EventListener
    public void onIssueCreated(IssueCreatedEvent event) {
        log.info("[NotificationEventListener] IssueCreatedEvent received for issueId={}", event.getIssueId());

        String title = "New Issue Raised: " + event.getTitle();
        String body = String.format(
                "Tenant %s raised a new issue in %s, Unit %s.\n\nDescription: %s",
                event.getCreatorName(),
                event.getPropertyName(),
                event.getUnitNumber(),
                event.getDescription()
        );

        // Notify the recipient (landlord or property manager) by email
        notificationService.send(event.getRecipientUserId(), NotificationChannel.EMAIL, title, body);
        // Also notify via WhatsApp
        notificationService.send(event.getRecipientUserId(), NotificationChannel.WHATSAPP, title, body);
    }

    /**
     * Fires when an issue is escalated by a tenant or landlord.
     * Notifies the other party with higher urgency messaging.
     */
    @Async
    @EventListener
    public void onIssueEscalated(IssueEscalatedEvent event) {
        log.info("[NotificationEventListener] IssueEscalatedEvent received for issueId={}", event.getIssueId());

        String title = "⚠ ESCALATED: " + event.getTitle();
        String body = String.format(
                "Issue #%s in %s (Unit %s) has been ESCALATED.\n\nReason: %s\n\nImmediate attention required.",
                event.getIssueId(),
                event.getPropertyName(),
                event.getUnitNumber(),
                event.getReason()
        );

        notificationService.send(event.getRecipientUserId(), NotificationChannel.EMAIL, title, body);
        notificationService.send(event.getRecipientUserId(), NotificationChannel.WHATSAPP, title, body);
    }

    /**
     * Fires after the signup/resend transaction commits, so the recipient row is guaranteed to exist.
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onEmailVerificationRequested(EmailVerificationRequestedEvent event) {
        log.info("[NotificationEventListener] EmailVerificationRequestedEvent received for userId={}", event.getRecipientUserId());

        String title = "Your Livic verification code";
        String body = String.format(
                "Your Livic verification code is %s.\n\nIt expires in %d minutes. If you didn't try to sign up, you can ignore this email.",
                event.getCode(),
                event.getExpiresInMinutes()
        );

        notificationService.sendSensitive(event.getRecipientUserId(), NotificationChannel.EMAIL, title, body);
    }

    /**
     * Fires when a landlord or caretaker broadcasts an announcement to tenants.
     * Sends to all matching recipients (property/floor/unit scoped).
     */
    @Async
    @EventListener
    public void onAnnouncementBroadcast(AnnouncementBroadcastEvent event) {
        log.info("[NotificationEventListener] AnnouncementBroadcastEvent received for announcementId={}, recipients={}",
                event.getAnnouncementId(), event.getRecipientUserIds().size());

        String title = "[" + event.getCategory() + "] " + event.getTitle();
        String body = event.getContent();

        notificationService.sendBulk(event.getRecipientUserIds(), NotificationChannel.EMAIL, title, body);
    }
}
