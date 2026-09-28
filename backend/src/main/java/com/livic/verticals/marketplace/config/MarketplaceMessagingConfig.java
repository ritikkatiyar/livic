package com.livic.verticals.marketplace.config;

import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.MessagingService;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Configuration
public class MarketplaceMessagingConfig {

    private static final Set<NotificationChannel> OTP_CHANNELS = EnumSet.of(NotificationChannel.SMS, NotificationChannel.WHATSAPP);

    /**
     * Refuses to start when no configured OTP channel can deliver: prospects could never verify. Eager because the
     * app runs with lazy initialization.
     */
    @Bean
    @Lazy(false)
    public InitializingBean marketplaceOtpChannelCheck(MarketplaceOtpProperties otpProperties, MessagingService messagingService) {
        return () -> validate(otpProperties.getChannels(), messagingService.availableChannels());
    }

    static void validate(List<NotificationChannel> channels, Set<NotificationChannel> available) {
        if (channels == null || channels.isEmpty()) {
            throw new IllegalStateException("app.marketplace.otp.channels (MARKETPLACE_OTP_CHANNELS) must list SMS and/or WHATSAPP");
        }
        List<NotificationChannel> unsupported = channels.stream().filter(channel -> !OTP_CHANNELS.contains(channel)).toList();
        if (!unsupported.isEmpty()) {
            throw new IllegalStateException("app.marketplace.otp.channels supports only SMS and WHATSAPP, not " + unsupported);
        }
        if (channels.stream().noneMatch(available::contains)) {
            throw new IllegalStateException("None of the OTP channels " + channels + " can deliver: enable them in MSG91 settings"
                    + " (or APP_MESSAGING_CONSOLE_FALLBACK=true for local development)");
        }
    }
}
