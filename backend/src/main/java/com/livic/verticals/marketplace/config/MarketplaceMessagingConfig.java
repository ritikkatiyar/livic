package com.livic.verticals.marketplace.config;

import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.interfaces.MessagingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Configuration
@Slf4j
public class MarketplaceMessagingConfig {

    private static final Set<NotificationChannel> OTP_CHANNELS = EnumSet.of(NotificationChannel.SMS, NotificationChannel.WHATSAPP);

    /**
     * Refuses to start on an invalid OTP channel setting, and warns when no configured channel can deliver: the app
     * still starts, but prospects can't verify until one is enabled (each OTP request fails with a delivery error).
     * Eager because the app runs with lazy initialization.
     */
    @Bean
    @Lazy(false)
    public InitializingBean marketplaceOtpChannelCheck(MarketplaceOtpProperties otpProperties, MessagingService messagingService) {
        return () -> {
            List<NotificationChannel> channels = otpProperties.getChannels();
            if (!canDeliver(channels, messagingService.availableChannels())) {
                log.warn("otp_channels_unavailable channels={} - marketplace OTP can't be delivered until they are enabled"
                        + " in MSG91 settings (or APP_MESSAGING_CONSOLE_FALLBACK=true for local development)", channels);
            }
        };
    }

    /** Whether any configured OTP channel can deliver; throws when the setting itself is invalid. */
    static boolean canDeliver(List<NotificationChannel> channels, Set<NotificationChannel> available) {
        if (channels == null || channels.isEmpty()) {
            throw new IllegalStateException("app.marketplace.otp.channels (MARKETPLACE_OTP_CHANNELS) must list SMS and/or WHATSAPP");
        }
        List<NotificationChannel> unsupported = channels.stream().filter(channel -> !OTP_CHANNELS.contains(channel)).toList();
        if (!unsupported.isEmpty()) {
            throw new IllegalStateException("app.marketplace.otp.channels supports only SMS and WHATSAPP, not " + unsupported);
        }
        return channels.stream().anyMatch(available::contains);
    }
}
