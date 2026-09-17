package com.livic.platform.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.livic.platform.notification.config.Msg91Properties;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.impl.Msg91WhatsAppNotificationSender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

public class Msg91NotificationSenderTest {

    private Msg91Properties properties;
    private ObjectMapper objectMapper;
    private RestClient.Builder restClientBuilder;
    private MockRestServiceServer mockServer;

    @BeforeEach
    public void setUp() {
        properties = new Msg91Properties();
        properties.setEnabled(true);
        properties.setAuthKey("test-auth-key-123");
        properties.setSenderId("LIVICX");

        properties.getWhatsapp().setEnabled(true);
        properties.getWhatsapp().setIntegratedNumber("919999988888");

        objectMapper = new ObjectMapper();
        restClientBuilder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();
    }

    @Test
    public void testWhatsAppSender_SupportsChannel() {
        Msg91WhatsAppNotificationSender sender = new Msg91WhatsAppNotificationSender(properties, objectMapper, restClientBuilder.build());
        assertTrue(sender.supports(NotificationChannel.WHATSAPP));
        assertFalse(sender.supports(NotificationChannel.EMAIL));
        assertFalse(sender.supports(NotificationChannel.PUSH));
        assertFalse(sender.supports(NotificationChannel.SMS));
    }

    @Test
    public void testWhatsAppSender_SuccessfulSend() {
        mockServer.expect(requestTo("https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("authkey", "test-auth-key-123"))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andRespond(withSuccess("{\"status\":\"success\"}", MediaType.APPLICATION_JSON));

        Msg91WhatsAppNotificationSender sender = new Msg91WhatsAppNotificationSender(properties, objectMapper, restClientBuilder.build());
        assertDoesNotThrow(() -> sender.send("9876543210", "Rent Due", "Your rent is ready"));

        mockServer.verify();
    }
}
