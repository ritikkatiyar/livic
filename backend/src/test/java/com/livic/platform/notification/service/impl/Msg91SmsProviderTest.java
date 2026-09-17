package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.config.Msg91Properties;
import com.livic.platform.notification.domain.MessageTemplate;
import com.livic.platform.notification.dto.TemplatedMessage;
import com.livic.platform.notification.exception.NotificationSendException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class Msg91SmsProviderTest {

    private static final TemplatedMessage OTP = TemplatedMessage.of(MessageTemplate.MARKETPLACE_OTP, Map.of("otp", "482913", "minutes", "5"));

    private MockRestServiceServer server;
    private Msg91SmsProvider provider;

    @BeforeEach
    void setUp() {
        Msg91Properties properties = new Msg91Properties();
        properties.setAuthKey("test-auth-key");
        properties.getSms().setEnabled(true);
        properties.getSms().getFlows().put(MessageTemplate.MARKETPLACE_OTP, "flow-otp");

        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        provider = new Msg91SmsProvider(properties, builder.build());
    }

    @Test
    @DisplayName("Posts the template's flow id with the variables by name")
    void postsFlowWithVariables() {
        server.expect(requestTo(Msg91SmsProvider.FLOW_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("authkey", "test-auth-key"))
                .andExpect(jsonPath("$.template_id").value("flow-otp"))
                .andExpect(jsonPath("$.recipients[0].mobiles").value("919876543210"))
                .andExpect(jsonPath("$.recipients[0].otp").value("482913"))
                .andExpect(jsonPath("$.recipients[0].minutes").value("5"))
                .andRespond(withSuccess("{\"type\":\"success\",\"message\":\"3763646c3058\"}", MediaType.APPLICATION_JSON));

        assertDoesNotThrow(() -> provider.send("919876543210", OTP));
        server.verify();
    }

    @Test
    @DisplayName("A 200 carrying an MSG91 error is a non-retryable failure")
    void errorBodyFails() {
        server.expect(requestTo(Msg91SmsProvider.FLOW_URL))
                .andRespond(withSuccess("{\"type\":\"error\",\"message\":\"Invalid template\"}", MediaType.APPLICATION_JSON));

        NotificationSendException error = assertThrows(NotificationSendException.class, () -> provider.send("919876543210", OTP));
        assertFalse(error.isRetryable());
        assertTrue(error.getMessage().contains("Invalid template"));
    }

    @Test
    @DisplayName("Gateway 5xx is retryable; 4xx is not")
    void classifiesHttpErrors() {
        server.expect(requestTo(Msg91SmsProvider.FLOW_URL)).andRespond(withStatus(HttpStatus.BAD_GATEWAY));
        server.expect(requestTo(Msg91SmsProvider.FLOW_URL)).andRespond(withStatus(HttpStatus.UNAUTHORIZED));

        assertTrue(assertThrows(NotificationSendException.class, () -> provider.send("919876543210", OTP)).isRetryable());
        assertFalse(assertThrows(NotificationSendException.class, () -> provider.send("919876543210", OTP)).isRetryable());
    }
}
