package com.livic.core.community.issue.event;

import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.interfaces.NotificationService;
import com.livic.platform.outbox.spi.OutboxConsumer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Tells a manager an issue was escalated, by email and WhatsApp. */
@Component
@RequiredArgsConstructor
public class IssueEscalatedNotifier implements OutboxConsumer<IssueEscalatedEvent> {

    private final NotificationService notificationService;

    @Override
    public String name() {
        return "issue.escalated-notice";
    }

    @Override
    public Class<IssueEscalatedEvent> eventType() {
        return IssueEscalatedEvent.class;
    }

    @Override
    public Delivery delivery() {
        // Sending messages is slow; the request that caused them should not wait.
        return Delivery.BACKGROUND;
    }

    @Override
    public void handle(IssueEscalatedEvent event) {
        String title = "\u26A0 ESCALATED: " + event.title();
        String body = String.format("Issue #%s in %s (Unit %s) has been ESCALATED.%n%nReason: %s%n%nImmediate attention required.",
                event.issueId(), event.propertyName(), event.unitNumber(), event.reason());
        notificationService.send(event.recipientUserId(), NotificationChannel.EMAIL, title, body);
        notificationService.send(event.recipientUserId(), NotificationChannel.WHATSAPP, title, body);
    }
}
