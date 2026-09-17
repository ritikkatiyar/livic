package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.config.Msg91Properties;
import com.livic.platform.notification.config.SmsConfig;
import com.livic.platform.notification.dto.TemplatedMessage;
import com.livic.platform.notification.exception.NotificationSendException;
import com.livic.platform.notification.service.SmsProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Sends SMS through the MSG91 Flow API: one flow per DLT template, variables passed by name. */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "msg91.sms", name = "enabled", havingValue = "true")
public class Msg91SmsProvider implements SmsProvider {

    static final String FLOW_URL = "https://control.msg91.com/api/v5/flow";

    private final Msg91Properties properties;
    private final RestClient restClient;

    public Msg91SmsProvider(Msg91Properties properties, @Qualifier(SmsConfig.MSG91_SMS_REST_CLIENT) RestClient restClient) {
        this.properties = properties;
        this.restClient = restClient;
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

        Map<?, ?> response;
        try {
            response = restClient.post()
                    .uri(FLOW_URL)
                    .header("authkey", properties.getAuthKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(Map.class);
        } catch (ResourceAccessException | HttpServerErrorException e) {
            throw new NotificationSendException("MSG91 unavailable: " + e.getMessage(), e, true);
        } catch (HttpClientErrorException e) {
            throw new NotificationSendException("MSG91 rejected the request: " + e.getStatusCode(), e);
        } catch (RestClientException e) {
            throw new NotificationSendException("MSG91 request failed: " + e.getMessage(), e);
        }

        // MSG91 can answer 200 with {"type":"error","message":...}
        if (response != null && "error".equalsIgnoreCase(String.valueOf(response.get("type")))) {
            throw new NotificationSendException("MSG91 rejected the message: " + response.get("message"), null);
        }
        log.info("sms_sent provider=msg91 template={} to={}", message.template(), PhoneNumbers.mask(msisdn));
    }
}
