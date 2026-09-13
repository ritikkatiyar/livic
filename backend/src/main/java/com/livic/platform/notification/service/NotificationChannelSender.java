package com.livic.platform.notification.service;

import com.livic.platform.notification.domain.NotificationChannel;

/**
 * Strategy interface for dispatching a notification over a specific channel.
 *
 * Design Patterns applied:
 * - Strategy Pattern: Each implementation represents a distinct delivery mechanism (Email, WhatsApp, Console).
 * - OCP (Open/Closed): New channels are added by creating new implementations, never by modifying this interface.
 * - LSP (Liskov Substitution): All implementations are drop-in substitutes for this contract.
 * - DIP (Dependency Inversion): NotificationServiceImpl depends on this interface, NOT on concrete implementations.
 */
public interface NotificationChannelSender {

    /**
     * Returns true if this sender handles the given notification channel.
     * Used by NotificationServiceImpl to resolve the correct strategy at runtime.
     */
    boolean supports(NotificationChannel channel);

    /**
     * Dispatches a notification message through this channel.
     *
     * @param recipientAddress The email address or phone number of the recipient.
     * @param title            The notification title or subject.
     * @param body             The full notification body text.
     */
    void send(String recipientAddress, String title, String body);
}
