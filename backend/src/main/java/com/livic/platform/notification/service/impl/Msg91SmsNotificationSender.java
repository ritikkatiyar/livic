package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.config.Msg91Properties;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.NotificationChannelSender;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.*;

/**
 * SMS notification sender backed by MSG91 Flow API.
 * Active when msg91.sms.enabled is set to true.
 */
@Component
@Order(1)
@ConditionalOnProperty(prefix = "msg91.sms", name = "enabled", havingValue = "true")
@Slf4j
public class Msg91SmsNotificationSender implements NotificationChannelSender {

    private static final String MSG91_FLOW_URL = "https://control.msg91.com/api/v5/flow/";

    private final Msg91Properties msg91Properties;
    private final RestClient restClient;

    public Msg91SmsNotificationSender(Msg91Properties msg91Properties, RestClient.Builder restClientBuilder) {
        this.msg91Properties = msg91Properties;
        this.restClient = restClientBuilder != null ? restClientBuilder.build() : RestClient.create();
    }

    public Msg91SmsNotificationSender(Msg91Properties msg91Properties, RestClient restClient) {
        this.msg91Properties = msg91Properties;
        this.restClient = restClient;
    }

    @Override
    public boolean supports(NotificationChannel channel) {
        return channel == NotificationChannel.SMS;
    }

    @Override
    public void send(String recipientAddress, String title, String body) {
        log.info("[Msg91SmsNotificationSender] Preparing SMS dispatch to {}", recipientAddress);

        if (recipientAddress == null || recipientAddress.isBlank()) {
            log.warn("[Msg91SmsNotificationSender] Empty recipient phone number. Skipping.");
            return;
        }

        String normalizedPhone = normalizePhoneNumber(recipientAddress);

        try {
            Map<String, Object> recipient = new LinkedHashMap<>();
            recipient.put("mobiles", normalizedPhone);
            recipient.put("title", title != null ? title : "");
            recipient.put("body", body != null ? body : "");

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("template_id", msg91Properties.getSms().getFlowId());
            if (msg91Properties.getSenderId() != null && !msg91Properties.getSenderId().isBlank()) {
                payload.put("sender", msg91Properties.getSenderId());
            }
            payload.put("short_url", "0");
            payload.put("recipients", List.of(recipient));

            restClient.post()
                    .uri(MSG91_FLOW_URL)
                    .header("authkey", msg91Properties.getAuthKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();

            log.info("[Msg91SmsNotificationSender] SMS message successfully dispatched via MSG91 to {}", normalizedPhone);
        } catch (org.springframework.web.client.RestClientException e) {
            log.error("[Msg91SmsNotificationSender] HTTP client error sending SMS to {}: {}", normalizedPhone, e.getMessage());
            throw new RuntimeException("MSG91 SMS API delivery error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("[Msg91SmsNotificationSender] Failed to send SMS message to {}: {}", normalizedPhone, e.getMessage());
            throw new RuntimeException("MSG91 SMS dispatch failed: " + e.getMessage(), e);
        }
    }

    private String normalizePhoneNumber(String phone) {
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.length() == 10) {
            return "91" + digits; // Default to India country code
        }
        return digits;
    }
}
