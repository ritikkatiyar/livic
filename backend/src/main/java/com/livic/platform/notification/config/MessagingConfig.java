package com.livic.platform.notification.config;

import com.livic.platform.notification.domain.MessageTemplate;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Configuration
public class MessagingConfig {

    public static final String MSG91_REST_CLIENT = "msg91MessagingRestClient";

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(3);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(5);

    /** Short timeouts: an OTP request waits on this call, and a slow gateway shouldn't hold the request thread. */
    @Bean(MSG91_REST_CLIENT)
    public RestClient msg91MessagingRestClient(RestClient.Builder builder) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(CONNECT_TIMEOUT);
        requestFactory.setReadTimeout(READ_TIMEOUT);
        return builder.requestFactory(requestFactory).build();
    }

    /**
     * Checks gateway settings at startup rather than on the first message. Eager because the app runs with lazy
     * initialization, which would otherwise defer this until something is sent.
     */
    @Bean
    @Lazy(false)
    public InitializingBean msg91ConfigurationCheck(Msg91Properties properties) {
        return () -> validate(properties);
    }

    static void validate(Msg91Properties properties) {
        boolean sms = properties.getSms().isEnabled();
        boolean whatsapp = properties.getWhatsapp().isEnabled();
        if (!sms && !whatsapp) {
            return;
        }
        if (isBlank(properties.getAuthKey())) {
            throw new IllegalStateException("MSG91 SMS or WhatsApp is enabled but msg91.auth-key (MSG91_AUTH_KEY) is not set");
        }
        if (sms) {
            requireEveryTemplate(properties.getSms().getFlows(), "msg91.sms.flows", "MSG91 flow id");
        }
        if (whatsapp) {
            if (isBlank(properties.getWhatsapp().getIntegratedNumber())) {
                throw new IllegalStateException(
                        "msg91.whatsapp.enabled is true but msg91.whatsapp.integrated-number (MSG91_WHATSAPP_INTEGRATED_NUMBER) is not set");
            }
            requireEveryTemplate(properties.getWhatsapp().getTemplates(), "msg91.whatsapp.templates", "WhatsApp template name");
        }
    }

    private static void requireEveryTemplate(Map<MessageTemplate, String> configured, String property, String what) {
        List<MessageTemplate> missing = Arrays.stream(MessageTemplate.values())
                .filter(template -> isBlank(configured.get(template)))
                .toList();
        if (!missing.isEmpty()) {
            throw new IllegalStateException(property + " is missing a " + what + " for: " + missing);
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
