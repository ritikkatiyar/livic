package com.livic.verticals.marketplace.config;

import com.livic.platform.notification.domain.NotificationChannel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class MarketplaceMessagingConfigTest {

    @Test
    @DisplayName("Starts when at least one OTP channel can deliver")
    void oneWorkingChannelIsEnough() {
        assertDoesNotThrow(() -> MarketplaceMessagingConfig.validate(
                List.of(NotificationChannel.SMS, NotificationChannel.WHATSAPP), Set.of(NotificationChannel.WHATSAPP)));
    }

    @Test
    @DisplayName("Refuses to start when OTP could never be delivered, or the setting is empty or not a messaging channel")
    void refusesUndeliverableOtp() {
        assertThrows(IllegalStateException.class,
                () -> MarketplaceMessagingConfig.validate(List.of(NotificationChannel.SMS), Set.of()));
        assertThrows(IllegalStateException.class,
                () -> MarketplaceMessagingConfig.validate(List.of(), Set.of(NotificationChannel.SMS)));
        assertThrows(IllegalStateException.class,
                () -> MarketplaceMessagingConfig.validate(List.of(NotificationChannel.EMAIL), Set.of(NotificationChannel.SMS)));
    }
}
