package com.livic.platform.notification.service;

import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.dto.TemplatedMessage;
import com.livic.platform.notification.exception.NotificationSendException;

/** Delivers templated messages on one channel through one gateway. */
public interface ChannelProvider {

    NotificationChannel channel();

    /**
     * @param msisdn  the recipient with country code and no "+" (e.g. 919876543210)
     * @param message already fitted to this channel's limits
     * @throws NotificationSendException when the gateway refuses the message or can't be reached
     */
    void send(String msisdn, TemplatedMessage message);
}
