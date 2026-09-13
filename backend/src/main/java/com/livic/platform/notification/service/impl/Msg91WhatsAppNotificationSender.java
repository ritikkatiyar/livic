package com.livic.platform.notification.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
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
 * WhatsApp notification sender backed by MSG91 WhatsApp Outbound API.
 * Active when msg91.whatsapp.enabled is set to true.
 */
@Component
@Order(1)
@ConditionalOnProperty(prefix = "msg91.whatsapp", name = "enabled", havingValue = "true")
@Slf4j
public class Msg91WhatsAppNotificationSender implements NotificationChannelSender {

    private static final String MSG91_WHATSAPP_URL = "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/";

    private final Msg91Properties msg91Properties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public Msg91WhatsAppNotificationSender(
            Msg91Properties msg91Properties,
            ObjectMapper objectMapper,
            RestClient.Builder restClientBuilder
    ) {
        this.msg91Properties = msg91Properties;
        this.objectMapper = objectMapper;
        this.restClient = restClientBuilder != null ? restClientBuilder.build() : RestClient.create();
    }

    public Msg91WhatsAppNotificationSender(Msg91Properties msg91Properties, ObjectMapper objectMapper, RestClient restClient) {
        this.msg91Properties = msg91Properties;
        this.objectMapper = objectMapper;
        this.restClient = restClient;
    }

    @Override
    public boolean supports(NotificationChannel channel) {
        return channel == NotificationChannel.WHATSAPP;
    }

    @Override
    public void send(String recipientAddress, String title, String body) {
        log.info("[Msg91WhatsAppNotificationSender] Preparing WhatsApp dispatch to {}", recipientAddress);

        if (recipientAddress == null || recipientAddress.isBlank()) {
            log.warn("[Msg91WhatsAppNotificationSender] Empty recipient phone number. Skipping.");
            return;
        }

        String normalizedPhone = normalizePhoneNumber(recipientAddress);
        TemplateInfo templateInfo = resolveTemplateInfo(title, body);

        try {
            Map<String, Object> payload = buildPayload(normalizedPhone, templateInfo);

            restClient.post()
                    .uri(MSG91_WHATSAPP_URL)
                    .header("authkey", msg91Properties.getAuthKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();

            log.info("[Msg91WhatsAppNotificationSender] WhatsApp message successfully dispatched via MSG91 to {}", normalizedPhone);
        } catch (org.springframework.web.client.RestClientException e) {
            log.error("[Msg91WhatsAppNotificationSender] HTTP client error sending WhatsApp to {}: {}", normalizedPhone, e.getMessage());
            throw new RuntimeException("MSG91 WhatsApp API delivery error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("[Msg91WhatsAppNotificationSender] Failed to send WhatsApp message to {}: {}", normalizedPhone, e.getMessage());
            throw new RuntimeException("MSG91 WhatsApp dispatch failed: " + e.getMessage(), e);
        }
    }

    private record TemplateInfo(String name, List<String> params) {}

    private TemplateInfo resolveTemplateInfo(String title, String body) {
        String templateName = "general_notification";
        List<String> templateParams = new ArrayList<>();

        if (body != null && body.trim().startsWith("{")) {
            try {
                Map<String, Object> json = objectMapper.readValue(
                        body,
                        new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}
                );
                if (json.containsKey("template")) {
                    templateName = String.valueOf(json.get("template"));
                }
                if (json.containsKey("parameters") && json.get("parameters") instanceof List<?> list) {
                    for (Object item : list) {
                        templateParams.add(String.valueOf(item));
                    }
                }
                return new TemplateInfo(templateName, templateParams);
            } catch (Exception e) {
                log.debug("[Msg91WhatsAppNotificationSender] Could not parse body as JSON, using raw text", e);
            }
        }

        if (title != null && !title.isBlank()) {
            templateParams.add(title);
        }
        if (body != null && !body.isBlank()) {
            templateParams.add(body);
        }
        return new TemplateInfo(templateName, templateParams);
    }

    private Map<String, Object> buildPayload(String normalizedPhone, TemplateInfo templateInfo) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("integrated_number", msg91Properties.getWhatsapp().getIntegratedNumber());
        payload.put("content_type", "template");

        Map<String, Object> templateDetails = new LinkedHashMap<>();
        templateDetails.put("name", templateInfo.name());

        Map<String, String> language = new LinkedHashMap<>();
        language.put("code", "en");
        language.put("policy", "deterministic");
        templateDetails.put("language", language);

        Map<String, Object> components = new LinkedHashMap<>();
        Map<String, Object> bodyComponent = new LinkedHashMap<>();
        bodyComponent.put("params", templateInfo.params());
        components.put("body", bodyComponent);
        templateDetails.put("components", components);

        Map<String, Object> innerPayload = new LinkedHashMap<>();
        innerPayload.put("to", normalizedPhone);
        innerPayload.put("type", "template");
        innerPayload.put("template", templateDetails);

        payload.put("payload", innerPayload);
        return payload;
    }

    private String normalizePhoneNumber(String phone) {
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.length() == 10) {
            return "91" + digits; // Default to India country code
        }
        return digits;
    }
}
