package com.livic.core.community.announcement.event;

import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.interfaces.NotificationService;
import com.livic.platform.outbox.spi.OutboxConsumer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Emails a notice to the residents it targets. */
@Component
@RequiredArgsConstructor
public class AnnouncementBroadcastNotifier implements OutboxConsumer<AnnouncementBroadcastEvent> {

    private final NotificationService notificationService;

    @Override
    public String name() {
        return "announcement.broadcast-notice";
    }

    @Override
    public Class<AnnouncementBroadcastEvent> eventType() {
        return AnnouncementBroadcastEvent.class;
    }

    @Override
    public Delivery delivery() {
        // Sending messages is slow; the request that caused them should not wait.
        return Delivery.BACKGROUND;
    }

    @Override
    public boolean accepts(AnnouncementBroadcastEvent event) {
        return event.recipientUserIds() != null && !event.recipientUserIds().isEmpty();
    }

    @Override
    public void handle(AnnouncementBroadcastEvent event) {
        notificationService.sendBulk(event.recipientUserIds(), NotificationChannel.EMAIL,
                "[" + event.category() + "] " + event.title(), event.content());
    }
}
