package com.livic.notification.service;

import com.livic.notification.domain.NotificationChannel;
import java.util.List;

/**
 * Service interface for dispatching notifications through any available channel.
 *
 * Design Notes:
 * - SRP: This interface defines the contract for notification orchestration only.
 * - DIP: Callers (e.g. NotificationEventListener) depend on this abstraction, not the impl.
 */
public interface NotificationService {

    /**
     * Sends a notification to a single user by their internal user ID.
     *
     * @param recipientUserId The UUID of the target user (used to look up their contact info).
     * @param channel         The delivery channel (EMAIL, WHATSAPP, PUSH, SMS).
     * @param title           The notification subject / title.
     * @param body            The notification body message.
     */
    void send(String recipientUserId, NotificationChannel channel, String title, String body);

    /**
     * Same as {@link #send}, but the body is not stored in the notification audit log.
     * Use for messages carrying secrets such as one-time verification codes.
     */
    void sendSensitive(String recipientUserId, NotificationChannel channel, String title, String body);

    /**
     * Sends the same notification to multiple users (bulk broadcast).
     * Used by announcements to reach all property tenants at once.
     *
     * @param recipientUserIds List of UUIDs of target users.
     * @param channel          The delivery channel.
     * @param title            The notification title.
     * @param body             The notification body.
     */
    void sendBulk(List<String> recipientUserIds, NotificationChannel channel, String title, String body);
}
