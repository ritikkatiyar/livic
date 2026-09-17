package com.livic.platform.notification.service;

import com.livic.platform.notification.dto.TemplatedMessage;

/** Sends templated transactional SMS and records each attempt in the notification log. */
public interface SmsService {

    /**
     * Sends to a phone number that may not belong to a registered user (e.g. a marketplace prospect).
     * Never throws for delivery problems; failures are logged and recorded.
     *
     * @param phone an Indian mobile number: 10 digits, optionally prefixed with +91 or 91
     * @return true if the gateway accepted the message
     */
    boolean sendToPhone(String phone, TemplatedMessage message);
}
