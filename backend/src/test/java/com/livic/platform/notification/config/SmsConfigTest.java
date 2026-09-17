package com.livic.platform.notification.config;

import com.livic.platform.notification.domain.MessageTemplate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SmsConfigTest {

    @Test
    @DisplayName("Binds flow ids from kebab-case template keys")
    void bindsFlowsByTemplate() {
        Msg91Properties properties = bind(Map.of(
                "msg91.auth-key", "key",
                "msg91.sms.enabled", "true",
                "msg91.sms.flows.marketplace-otp", "flow-otp",
                "msg91.sms.flows.tour-approved", "flow-approved",
                "msg91.sms.flows.tour-declined", "flow-declined",
                "msg91.sms.flows.tour-reminder", "flow-reminder"));

        assertEquals("flow-otp", properties.getSms().getFlows().get(MessageTemplate.MARKETPLACE_OTP));
        assertEquals("flow-reminder", properties.getSms().getFlows().get(MessageTemplate.TOUR_REMINDER));
        assertDoesNotThrow(() -> SmsConfig.validate(properties));
    }

    @Test
    @DisplayName("Enabled SMS needs an auth key and a flow for every template")
    void enabledNeedsCompleteSettings() {
        Msg91Properties noKey = bind(Map.of("msg91.sms.enabled", "true"));
        assertTrue(assertThrows(IllegalStateException.class, () -> SmsConfig.validate(noKey)).getMessage().contains("auth-key"));

        Msg91Properties missingFlow = bind(Map.of(
                "msg91.auth-key", "key",
                "msg91.sms.enabled", "true",
                "msg91.sms.flows.marketplace-otp", "flow-otp"));
        String message = assertThrows(IllegalStateException.class, () -> SmsConfig.validate(missingFlow)).getMessage();
        assertTrue(message.contains("TOUR_APPROVED") && message.contains("TOUR_REMINDER"));
        assertFalse(message.contains("MARKETPLACE_OTP"));
    }

    @Test
    @DisplayName("Disabled SMS is fine unless required (production)")
    void disabledOnlyFailsWhenRequired() {
        assertDoesNotThrow(() -> SmsConfig.validate(bind(Map.of())));

        Msg91Properties required = bind(Map.of("msg91.sms.required", "true"));
        assertThrows(IllegalStateException.class, () -> SmsConfig.validate(required));
    }

    private static Msg91Properties bind(Map<String, String> values) {
        Binder binder = new Binder(new MapConfigurationPropertySource(values));
        return binder.bind("msg91", Bindable.ofInstance(new Msg91Properties())).orElseGet(Msg91Properties::new);
    }
}
