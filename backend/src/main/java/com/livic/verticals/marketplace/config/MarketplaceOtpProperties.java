package com.livic.verticals.marketplace.config;

import com.livic.platform.notification.domain.NotificationChannel;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/** Platform-wide OTP delivery settings; the code is always sent on at least one channel. */
@Component
@ConfigurationProperties(prefix = "app.marketplace.otp")
@Getter
@Setter
public class MarketplaceOtpProperties {

    /** Tried in order until one delivers, e.g. [SMS] or [SMS, WHATSAPP] for WhatsApp fallback. */
    private List<NotificationChannel> channels = new ArrayList<>(List.of(NotificationChannel.SMS));
}
