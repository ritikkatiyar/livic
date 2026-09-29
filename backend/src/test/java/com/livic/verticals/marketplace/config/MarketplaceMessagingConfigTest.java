package com.livic.verticals.marketplace.config;

import com.livic.platform.notification.domain.NotificationChannel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class MarketplaceMessagingConfigTest {

    @Test
    @DisplayName("OTP can be delivered when at least one configured channel works")
    void oneWorkingChannelIsEnough() {
        assertTrue(MarketplaceMessagingConfig.canDeliver(
                List.of(NotificationChannel.SMS, NotificationChannel.WHATSAPP), Set.of(NotificationChannel.WHATSAPP)));
    }

    @Test
    @DisplayName("Reports undeliverable OTP without refusing to start")
    void undeliverableOtpOnlyReports() {
        assertFalse(MarketplaceMessagingConfig.canDeliver(List.of(NotificationChannel.SMS), Set.of()));
    }

    @Test
    @DisplayName("Refuses to start when the setting is empty or not a messaging channel")
    void refusesInvalidSetting() {
        assertThrows(IllegalStateException.class,
                () -> MarketplaceMessagingConfig.canDeliver(List.of(), Set.of(NotificationChannel.SMS)));
        assertThrows(IllegalStateException.class,
                () -> MarketplaceMessagingConfig.canDeliver(List.of(NotificationChannel.EMAIL), Set.of(NotificationChannel.SMS)));
    }
}
