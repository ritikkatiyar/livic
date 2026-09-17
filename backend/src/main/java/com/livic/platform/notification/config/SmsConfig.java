package com.livic.platform.notification.config;

import com.livic.platform.notification.domain.MessageTemplate;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

@Configuration
public class SmsConfig {

    public static final String MSG91_SMS_REST_CLIENT = "msg91SmsRestClient";

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(3);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(5);

    /** Short timeouts: an OTP request waits on this call, and a slow gateway shouldn't hold the request thread. */
    @Bean(MSG91_SMS_REST_CLIENT)
    @ConditionalOnProperty(prefix = "msg91.sms", name = "enabled", havingValue = "true")
    public RestClient msg91SmsRestClient(RestClient.Builder builder) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(CONNECT_TIMEOUT);
        requestFactory.setReadTimeout(READ_TIMEOUT);
        return builder.requestFactory(requestFactory).build();
    }

    /**
     * Checks SMS settings at startup rather than on the first message. Eager because the app runs with lazy
     * initialization, which would otherwise defer this until something sends an SMS.
     */
    @Bean
    @Lazy(false)
    public InitializingBean smsConfigurationCheck(Msg91Properties properties) {
        return () -> validate(properties);
    }

    static void validate(Msg91Properties properties) {
        Msg91Properties.SmsProperties sms = properties.getSms();
        if (!sms.isEnabled()) {
            if (sms.isRequired()) {
                throw new IllegalStateException(
                        "SMS is required (msg91.sms.required=true) but disabled; set MSG91_SMS_ENABLED=true and the MSG91 settings");
            }
            return;
        }
        if (properties.getAuthKey() == null || properties.getAuthKey().isBlank()) {
            throw new IllegalStateException("msg91.sms.enabled is true but msg91.auth-key (MSG91_AUTH_KEY) is not set");
        }
        List<MessageTemplate> missing = Arrays.stream(MessageTemplate.values())
                .filter(template -> {
                    String flowId = sms.getFlows().get(template);
                    return flowId == null || flowId.isBlank();
                })
                .toList();
        if (!missing.isEmpty()) {
            throw new IllegalStateException("msg91.sms.enabled is true but these templates have no MSG91 flow id: " + missing);
        }
    }
}
