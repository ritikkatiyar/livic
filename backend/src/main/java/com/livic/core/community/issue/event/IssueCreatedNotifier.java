package com.livic.core.community.issue.event;

import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.interfaces.NotificationService;
import com.livic.platform.outbox.spi.OutboxConsumer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Tells staff about a new issue, by email and WhatsApp. */
@Component
@RequiredArgsConstructor
public class IssueCreatedNotifier implements OutboxConsumer<IssueCreatedEvent> {

    private final NotificationService notificationService;

    @Override
    public String name() {
        return "issue.created-notice";
    }

    @Override
    public Class<IssueCreatedEvent> eventType() {
        return IssueCreatedEvent.class;
    }

    @Override
    public Delivery delivery() {
        // Sending messages is slow; the request that caused them should not wait.
        return Delivery.BACKGROUND;
    }

    @Override
    public void handle(IssueCreatedEvent event) {
        String title = "New Issue Raised: " + event.title();
        String body = String.format("%s raised a new issue in %s, Unit %s.%n%nDescription: %s",
                event.creatorName(), event.propertyName(), event.unitNumber(), event.description());
        notificationService.send(event.recipientUserId(), NotificationChannel.EMAIL, title, body);
        notificationService.send(event.recipientUserId(), NotificationChannel.WHATSAPP, title, body);
    }
}
