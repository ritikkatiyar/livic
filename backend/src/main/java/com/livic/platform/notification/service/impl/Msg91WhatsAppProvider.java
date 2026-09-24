package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.config.MessagingConfig;
import com.livic.platform.notification.config.Msg91Properties;
import com.livic.platform.notification.domain.MessageTemplate;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.dto.TemplatedMessage;
import com.livic.platform.notification.service.ChannelProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Sends Meta-approved WhatsApp templates through MSG91's outbound API. Body parameters {{1}}..{{n}} follow the
 * template's variable order. The OTP is a Meta Authentication template, whose wording is fixed by Meta: its body takes
 * only the code, the expiry is set on the template, and the copy-code button repeats the code.
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "msg91.whatsapp", name = "enabled", havingValue = "true")
public class Msg91WhatsAppProvider implements ChannelProvider {

    static final String OUTBOUND_URL = "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

    private final Msg91Properties properties;
    private final Msg91Client client;

    public Msg91WhatsAppProvider(Msg91Properties properties, @Qualifier(MessagingConfig.MSG91_REST_CLIENT) RestClient restClient) {
        this.properties = properties;
        this.client = new Msg91Client(restClient, properties);
    }

    @Override
    public NotificationChannel channel() {
        return NotificationChannel.WHATSAPP;
    }

    @Override
    public void send(String msisdn, TemplatedMessage message) {
        Msg91Properties.WhatsAppProperties whatsapp = properties.getWhatsapp();

        Map<String, Object> components = new LinkedHashMap<>();
        if (message.template() == MessageTemplate.MARKETPLACE_OTP) {
            String code = message.variables().get("otp");
            components.put("body_1", Map.of("type", "text", "value", code));
            components.put("button_1", Map.of("subtype", "url", "type", "text", "value", code));
        } else {
            List<String> values = message.orderedValues();
            for (int i = 0; i < values.size(); i++) {
                components.put("body_" + (i + 1), Map.of("type", "text", "value", values.get(i)));
            }
        }

        Map<String, Object> template = new LinkedHashMap<>();
        template.put("name", whatsapp.getTemplates().get(message.template()));
        template.put("language", Map.of("code", whatsapp.getLanguage(), "policy", "deterministic"));
        if (whatsapp.getNamespace() != null && !whatsapp.getNamespace().isBlank()) {
            template.put("namespace", whatsapp.getNamespace());
        }
        template.put("to_and_components", List.of(Map.of("to", List.of(msisdn), "components", components)));

        Map<String, Object> innerPayload = new LinkedHashMap<>();
        innerPayload.put("messaging_product", "whatsapp");
        innerPayload.put("type", "template");
        innerPayload.put("template", template);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("integrated_number", whatsapp.getIntegratedNumber());
        payload.put("content_type", "template");
        payload.put("payload", innerPayload);

        client.post(OUTBOUND_URL, payload, "WhatsApp");
        log.info("message_sent channel=WHATSAPP provider=msg91 template={} to={}", message.template(), PhoneNumbers.mask(msisdn));
    }
}
