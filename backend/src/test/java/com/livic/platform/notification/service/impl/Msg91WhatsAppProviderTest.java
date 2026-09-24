package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.config.Msg91Properties;
import com.livic.platform.notification.domain.MessageTemplate;
import com.livic.platform.notification.domain.NotificationChannel;
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

class Msg91WhatsAppProviderTest {

    private static final String PREFIX = "$.payload.template.to_and_components[0]";

    private MockRestServiceServer server;
    private Msg91WhatsAppProvider provider;

    @BeforeEach
    void setUp() {
        Msg91Properties properties = new Msg91Properties();
        properties.setAuthKey("test-auth-key");
        properties.getWhatsapp().setEnabled(true);
        properties.getWhatsapp().setIntegratedNumber("919999988888");
        properties.getWhatsapp().getTemplates().put(MessageTemplate.TOUR_APPROVED, "tour_approved");
        properties.getWhatsapp().getTemplates().put(MessageTemplate.MARKETPLACE_OTP, "livic_otp");

        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        provider = new Msg91WhatsAppProvider(properties, builder.build());
    }

    @Test
    @DisplayName("Sends the approved template with body parameters in variable order")
    void sendsTemplateWithOrderedParams() {
        TemplatedMessage approved = TemplatedMessage.of(MessageTemplate.TOUR_APPROVED, Map.of(
                "name", "Riya", "property", "Test Residency", "date", "Fri, 18 Sep", "time", "11:00 AM",
                "link", "https://livic.in/market-place/my-requests"));

        server.expect(requestTo(Msg91WhatsAppProvider.OUTBOUND_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("authkey", "test-auth-key"))
                .andExpect(jsonPath("$.integrated_number").value("919999988888"))
                .andExpect(jsonPath("$.content_type").value("template"))
                .andExpect(jsonPath("$.payload.messaging_product").value("whatsapp"))
                .andExpect(jsonPath("$.payload.template.name").value("tour_approved"))
                .andExpect(jsonPath("$.payload.template.language.code").value("en"))
                .andExpect(jsonPath(PREFIX + ".to[0]").value("919876543210"))
                .andExpect(jsonPath(PREFIX + ".components.body_1.value").value("Riya"))
                .andExpect(jsonPath(PREFIX + ".components.body_2.value").value("Test Residency"))
                .andExpect(jsonPath(PREFIX + ".components.body_5.value").value("https://livic.in/market-place/my-requests"))
                .andExpect(jsonPath(PREFIX + ".components.button_1").doesNotExist())
                .andRespond(withSuccess("{\"status\":\"success\"}", MediaType.APPLICATION_JSON));

        assertDoesNotThrow(() -> provider.send("919876543210", approved));
        assertEquals(NotificationChannel.WHATSAPP, provider.channel());
        server.verify();
    }

    @Test
    @DisplayName("The OTP authentication template takes only the code, in the body and the copy-code button")
    void otpUsesCodeButton() {
        TemplatedMessage otp = TemplatedMessage.of(MessageTemplate.MARKETPLACE_OTP, Map.of("otp", "482913", "minutes", "5"));

        server.expect(requestTo(Msg91WhatsAppProvider.OUTBOUND_URL))
                .andExpect(jsonPath("$.payload.template.name").value("livic_otp"))
                .andExpect(jsonPath(PREFIX + ".components.body_1.value").value("482913"))
                .andExpect(jsonPath(PREFIX + ".components.body_2").doesNotExist())
                .andExpect(jsonPath(PREFIX + ".components.button_1.subtype").value("url"))
                .andExpect(jsonPath(PREFIX + ".components.button_1.value").value("482913"))
                .andRespond(withSuccess("{\"status\":\"success\"}", MediaType.APPLICATION_JSON));

        provider.send("919876543210", otp);
        server.verify();
    }

    @Test
    @DisplayName("Failures: an MSG91 fail body is not retryable, a gateway 5xx is")
    void classifiesFailures() {
        TemplatedMessage otp = TemplatedMessage.of(MessageTemplate.MARKETPLACE_OTP, Map.of("otp", "482913", "minutes", "5"));
        server.expect(requestTo(Msg91WhatsAppProvider.OUTBOUND_URL))
                .andRespond(withSuccess("{\"status\":\"fail\",\"errors\":\"Template not approved\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo(Msg91WhatsAppProvider.OUTBOUND_URL)).andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));

        NotificationSendException rejected = assertThrows(NotificationSendException.class, () -> provider.send("919876543210", otp));
        assertFalse(rejected.isRetryable());
        assertTrue(rejected.getMessage().contains("Template not approved"));
        assertTrue(assertThrows(NotificationSendException.class, () -> provider.send("919876543210", otp)).isRetryable());
    }
}
