package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.config.MessagingConfig;
import com.livic.platform.notification.config.Msg91Properties;
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

/** Sends SMS through the MSG91 Flow API: one flow per DLT template, variables passed by name. */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "msg91.sms", name = "enabled", havingValue = "true")
public class Msg91SmsProvider implements ChannelProvider {

    static final String FLOW_URL = "https://control.msg91.com/api/v5/flow";

    private final Msg91Properties properties;
    private final Msg91Client client;

    public Msg91SmsProvider(Msg91Properties properties, @Qualifier(MessagingConfig.MSG91_REST_CLIENT) RestClient restClient) {
        this.properties = properties;
        this.client = new Msg91Client(restClient, properties);
    }

    @Override
    public NotificationChannel channel() {
        return NotificationChannel.SMS;
    }

    @Override
    public void send(String msisdn, TemplatedMessage message) {
        Map<String, Object> recipient = new LinkedHashMap<>();
        recipient.put("mobiles", msisdn);
        recipient.putAll(message.variables());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("template_id", properties.getSms().getFlows().get(message.template()));
        payload.put("short_url", "0");
        payload.put("recipients", List.of(recipient));

        client.post(FLOW_URL, payload, "SMS");
        log.info("message_sent channel=SMS provider=msg91 template={} to={}", message.template(), PhoneNumbers.mask(msisdn));
    }
}
