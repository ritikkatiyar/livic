package com.livic.platform.notification.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

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
        private boolean enabled;
        private String flowId;
    }

    @Getter
    @Setter
    public static class WhatsAppProperties {
        private boolean enabled;
        private String integratedNumber;
        private Map<String, String> templates = new HashMap<>();
    }
}
