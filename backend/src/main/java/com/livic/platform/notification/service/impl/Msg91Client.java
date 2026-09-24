package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.config.Msg91Properties;
import com.livic.platform.notification.exception.NotificationSendException;
import org.springframework.http.MediaType;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

/** The MSG91 HTTP call shared by the SMS and WhatsApp providers, with failures sorted into retryable or not. */
class Msg91Client {

    private final RestClient restClient;
    private final Msg91Properties properties;

    Msg91Client(RestClient restClient, Msg91Properties properties) {
        this.restClient = restClient;
        this.properties = properties;
    }

    void post(String url, Map<String, Object> payload, String channelName) {
        Map<?, ?> response;
        try {
            response = restClient.post()
                    .uri(url)
                    .header("authkey", properties.getAuthKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(Map.class);
        } catch (ResourceAccessException | HttpServerErrorException e) {
            throw new NotificationSendException("MSG91 " + channelName + " unavailable: " + e.getMessage(), e, true);
        } catch (HttpClientErrorException e) {
            throw new NotificationSendException("MSG91 " + channelName + " rejected the request: " + e.getStatusCode(), e);
        } catch (RestClientException e) {
            throw new NotificationSendException("MSG91 " + channelName + " request failed: " + e.getMessage(), e);
        }

        // MSG91 can answer 200 with {"type":"error","message":...} (or "status":"fail" on some WhatsApp errors)
        if (response != null && ("error".equalsIgnoreCase(String.valueOf(response.get("type")))
                || "fail".equalsIgnoreCase(String.valueOf(response.get("status"))))) {
            Object reason = response.get("message") != null ? response.get("message") : response.get("errors");
            throw new NotificationSendException("MSG91 " + channelName + " rejected the message: " + reason, null);
        }
    }
}
