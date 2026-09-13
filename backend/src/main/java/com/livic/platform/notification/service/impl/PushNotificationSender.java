package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.NotificationChannelSender;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@Order(1)
@ConditionalOnProperty(prefix = "push", name = "enabled", havingValue = "true")
@Slf4j
public class PushNotificationSender implements NotificationChannelSender {

    private final RestClient restClient = RestClient.create();

    @Override
    public boolean supports(NotificationChannel channel) {
        return channel == NotificationChannel.PUSH;
    }

    @Override
    public void send(String recipientAddress, String title, String body) {
        log.info("[PushNotificationSender] Attempting to send push notification to token {}", recipientAddress);

        if (recipientAddress == null || recipientAddress.trim().isEmpty()) {
            log.info("[PushNotificationSender] Expo push token is empty. Skipping silently.");
            return;
        }

        // Expo token validation check: must start with ExponentPushToken or host.expo.ExponentPushToken
        if (!recipientAddress.startsWith("ExponentPushToken[") && !recipientAddress.startsWith("host.expo.ExponentPushToken[")) {
            log.warn("[PushNotificationSender] Invalid Expo push token prefix: {}. Skipping.", recipientAddress);
            return;
        }

        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("to", recipientAddress);
            payload.put("title", title);
            payload.put("body", body);

            restClient.post()
                    .uri("https://exp.host/--/api/v2/push/send")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();

            log.info("[PushNotificationSender] Push notification sent successfully to {}", recipientAddress);
        } catch (Exception e) {
            log.error("[PushNotificationSender] Failed to send push notification to {}: {}", recipientAddress, e.getMessage());
            throw new RuntimeException("Push notification delivery failed: " + e.getMessage(), e);
        }
    }
}
