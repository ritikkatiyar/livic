package com.livic.platform.notification.config;

import com.livic.platform.notification.domain.MessageTemplate;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;

@Component
@ConfigurationProperties(prefix = "msg91")
@Getter
@Setter
public class Msg91Properties {

    private boolean enabled;
    private String authKey;
    private String senderId = "LIVIC";
    private SmsProperties sms = new SmsProperties();
    private WhatsAppProperties whatsapp = new WhatsAppProperties();

    @Getter
    @Setter
    public static class SmsProperties {
        /** Sends real SMS through MSG91. */
        private boolean enabled;
        /** MSG91 flow id per template; each flow wraps one DLT-approved template. */
        private Map<MessageTemplate, String> flows = new EnumMap<>(MessageTemplate.class);
    }

    @Getter
    @Setter
    public static class WhatsAppProperties {
        /** Sends real WhatsApp messages through MSG91. */
        private boolean enabled;
        /** The business WhatsApp number connected in MSG91, with country code (e.g. 919876543210). */
        private String integratedNumber;
        /** Meta-approved template name per template. */
        private Map<MessageTemplate, String> templates = new EnumMap<>(MessageTemplate.class);
        /** Language code the templates were approved in. */
        private String language = "en";
        /** Template namespace shown in MSG91; optional. */
        private String namespace;
    }
}
