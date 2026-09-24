package com.livic.platform.notification.service;

import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.dto.DeliveryReport;
import com.livic.platform.notification.dto.TemplatedMessage;

import java.util.List;
import java.util.Set;

/**
 * Sends templated transactional messages (SMS, WhatsApp) to phone numbers and records each attempt in the
 * notification log. Delivery problems are reported, never thrown.
 */
public interface MessagingService {

    /**
     * Sends on every requested channel. Channels with no working gateway are skipped.
     *
     * @param phone an Indian mobile number: 10 digits, optionally prefixed with +91 or 91; the recipient may not be a user
     */
    DeliveryReport send(String phone, TemplatedMessage message, Set<NotificationChannel> channels);

    /** Tries the channels in order and stops at the first one that delivers (e.g. SMS, then WhatsApp). */
    DeliveryReport sendFirstSuccessful(String phone, TemplatedMessage message, List<NotificationChannel> channelsInOrder);

    /** Channels that can deliver right now: a configured gateway, or the console in development. */
    Set<NotificationChannel> availableChannels();
}
