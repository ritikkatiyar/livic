package com.livic.platform.notification.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.livic.platform.notification.config.WhatsAppProperties;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.NotificationChannelSender;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Order(1)
@ConditionalOnProperty(prefix = "whatsapp", name = "enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class WhatsAppNotificationSender implements NotificationChannelSender {

    private final WhatsAppProperties whatsappProperties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.create();

    private static final Set<String> ALLOWED_TEMPLATES = Set.of("issue_created", "issue_escalated");

    // Pattern for onIssueCreated: "Tenant %s raised a new issue in %s, Unit %s.\n\nDescription: %s"
    private static final Pattern ISSUE_CREATED_PATTERN = Pattern.compile(
            "Tenant\\s+(.+?)\\s+raised\\s+a\\s+new\\s+issue\\s+in\\s+(.+?),\\s+Unit\\s+(.+?)\\.\\s*Description:\\s*(.+)",
            Pattern.DOTALL | Pattern.CASE_INSENSITIVE
    );

    // Pattern for onIssueEscalated: "Issue #%s in %s (Unit %s) has been ESCALATED.\n\nReason: %s\n\nImmediate attention required."
    private static final Pattern ISSUE_ESCALATED_PATTERN = Pattern.compile(
            "Issue\\s+#(.+?)\\s+in\\s+(.+?)\\s+\\(Unit\\s+(.+?)\\)\\s+has\\s+been\\s+ESCALATED\\.\\s*Reason:\\s*(.+?)\\s*Immediate\\s+attention\\s+required\\.",
            Pattern.DOTALL | Pattern.CASE_INSENSITIVE
    );

    @Override
    public boolean supports(NotificationChannel channel) {
        return channel == NotificationChannel.WHATSAPP;
    }

    @Override
    public void send(String recipientAddress, String title, String body) {
        log.info("[WhatsAppNotificationSender] Preparing to send message to {}", recipientAddress);

        // Outbound template messages require pre-approval. We map/check templates.
        String templateName = null;
        List<String> parameters = new ArrayList<>();

        // Try to parse the body as structured JSON template call first
        boolean parsedAsJson = false;
        try {
            if (body != null && body.trim().startsWith("{")) {
                Map<?, ?> map = objectMapper.readValue(body, Map.class);
                if (map.containsKey("template") && map.containsKey("parameters")) {
                    templateName = (String) map.get("template");
                    Object paramsObj = map.get("parameters");
                    if (paramsObj instanceof List) {
                        for (Object p : (List<?>) paramsObj) {
                            parameters.add(String.valueOf(p));
                        }
                    }
                    parsedAsJson = true;
                }
            }
        } catch (Exception e) {
            log.debug("[WhatsAppNotificationSender] Failed to parse body as structured JSON, falling back to regex matching");
        }

        // If not JSON, apply pattern matching for backward compatibility with existing hardcoded notifications
        if (!parsedAsJson && body != null) {
            // Normalize whitespace and carriage returns for regex matching
            String normalizedBody = body.replace("\r\n", " ").replace("\n", " ").trim();

            Matcher createdMatcher = ISSUE_CREATED_PATTERN.matcher(normalizedBody);
            Matcher escalatedMatcher = ISSUE_ESCALATED_PATTERN.matcher(normalizedBody);

            if (createdMatcher.find()) {
                templateName = "issue_created";
                parameters.add(createdMatcher.group(1).trim()); // Tenant Name
                parameters.add(createdMatcher.group(2).trim()); // Property Name
                parameters.add(createdMatcher.group(3).trim()); // Unit Number
                parameters.add(createdMatcher.group(4).trim()); // Description
            } else if (escalatedMatcher.find()) {
                templateName = "issue_escalated";
                parameters.add(escalatedMatcher.group(1).trim()); // Issue ID
                parameters.add(escalatedMatcher.group(2).trim()); // Property Name
                parameters.add(escalatedMatcher.group(3).trim()); // Unit Number
                parameters.add(escalatedMatcher.group(4).trim()); // Reason
            }
        }

        // Validation checks
        if (templateName == null) {
            throw new IllegalArgumentException("WhatsApp notifications must use an approved template. Free-form text is not supported.");
        }

        if (!ALLOWED_TEMPLATES.contains(templateName)) {
            throw new IllegalArgumentException("WhatsApp template not configured: " + templateName);
        }

        // Meta Graph API Request Payload Construction
        try {
            String url = "https://graph.facebook.com/v19.0/" + whatsappProperties.getPhoneNumberId() + "/messages";

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("messaging_product", "whatsapp");
            payload.put("to", recipientAddress);
            payload.put("type", "template");

            Map<String, Object> template = new LinkedHashMap<>();
            template.put("name", templateName);

            Map<String, String> language = new LinkedHashMap<>();
            language.put("code", "en_US");
            template.put("language", language);

            List<Map<String, Object>> components = new ArrayList<>();
            Map<String, Object> bodyComponent = new LinkedHashMap<>();
            bodyComponent.put("type", "body");

            List<Map<String, String>> params = new ArrayList<>();
            for (String param : parameters) {
                Map<String, String> p = new LinkedHashMap<>();
                p.put("type", "text");
                p.put("text", param);
                params.add(p);
            }
            bodyComponent.put("parameters", params);
            components.add(bodyComponent);
            template.put("components", components);

            payload.put("template", template);

            log.info("[WhatsAppNotificationSender] POSTing to Meta API for template: {}", templateName);

            restClient.post()
                    .uri(url)
                    .header("Authorization", "Bearer " + whatsappProperties.getAccessToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();

            log.info("[WhatsAppNotificationSender] WhatsApp template message sent successfully to {}", recipientAddress);
        } catch (Exception e) {
            log.error("[WhatsAppNotificationSender] Failed to send WhatsApp notification: {}", e.getMessage());
            throw new RuntimeException("WhatsApp delivery failed: " + e.getMessage(), e);
        }
    }
}
