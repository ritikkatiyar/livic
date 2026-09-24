package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.ChannelProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Which gateway delivers each messaging channel. A channel without a configured gateway falls back to the console
 * only when {@code app.messaging.console-fallback} is on (development); otherwise it is unavailable, so production
 * never reports a message as sent that nobody received.
 */
@Component
class MessagingChannels {

    static final Set<NotificationChannel> MESSAGING_CHANNELS = Collections.unmodifiableSet(
            EnumSet.of(NotificationChannel.SMS, NotificationChannel.WHATSAPP));

    private final Map<NotificationChannel, ChannelProvider> providers = new EnumMap<>(NotificationChannel.class);

    MessagingChannels(List<ChannelProvider> gateways, @Value("${app.messaging.console-fallback:false}") boolean consoleFallback) {
        for (ChannelProvider gateway : gateways) {
            providers.put(gateway.channel(), gateway);
        }
        if (consoleFallback) {
            for (NotificationChannel channel : MESSAGING_CHANNELS) {
                providers.putIfAbsent(channel, new ConsoleChannelProvider(channel));
            }
        }
    }

    Optional<ChannelProvider> providerFor(NotificationChannel channel) {
        return Optional.ofNullable(providers.get(channel));
    }

    Set<NotificationChannel> available() {
        return providers.isEmpty() ? Set.of() : Collections.unmodifiableSet(EnumSet.copyOf(providers.keySet()));
    }
}
