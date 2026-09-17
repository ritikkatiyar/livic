package com.livic.platform.notification.service;

import com.livic.platform.notification.dto.TemplatedMessage;
import com.livic.platform.notification.exception.NotificationSendException;

/** Delivers a templated SMS through one gateway. Exactly one implementation is active, chosen by configuration. */
public interface SmsProvider {

    /**
     * @param msisdn  the recipient with country code and no "+" (e.g. 919876543210)
     * @throws NotificationSendException when the gateway refuses the message or can't be reached
     */
    void send(String msisdn, TemplatedMessage message);
}
