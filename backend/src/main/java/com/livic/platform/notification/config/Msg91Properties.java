package com.livic.platform.notification.config;

import com.livic.platform.notification.domain.MessageTemplate;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.HashMap;
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
        /** Sends real SMS through MSG91; when false, messages are printed to the console. */
        private boolean enabled;
        /** Refuse to start while SMS is disabled; set in production so OTPs can't silently go undelivered. */
        private boolean required;
        /** MSG91 flow id per template; each flow wraps one DLT-approved template. */
        private Map<MessageTemplate, String> flows = new EnumMap<>(MessageTemplate.class);
    }

    @Getter
    @Setter
    public static class WhatsAppProperties {
        private boolean enabled;
        private String integratedNumber;
        private Map<String, String> templates = new HashMap<>();
    }
}
