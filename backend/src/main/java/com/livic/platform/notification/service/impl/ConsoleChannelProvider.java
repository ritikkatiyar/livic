package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.dto.TemplatedMessage;
import com.livic.platform.notification.service.ChannelProvider;
import lombok.extern.slf4j.Slf4j;

/**
 * Prints messages to the application log instead of sending them. Used for a channel with no gateway configured,
 * only when console fallback is allowed (development).
 */
@Slf4j
class ConsoleChannelProvider implements ChannelProvider {

    private final NotificationChannel channel;

    ConsoleChannelProvider(NotificationChannel channel) {
        this.channel = channel;
    }

    @Override
    public NotificationChannel channel() {
        return channel;
    }

    @Override
    public void send(String msisdn, TemplatedMessage message) {
        log.info("[{} - not sent, console provider] to={} template={}: {}",
                channel, PhoneNumbers.mask(msisdn), message.template(), message.render());
    }
}
