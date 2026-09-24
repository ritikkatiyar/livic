package com.livic.platform.notification.config;

import com.livic.platform.notification.domain.MessageTemplate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class MessagingConfigTest {

    @Test
    @DisplayName("Binds SMS flows and WhatsApp templates from kebab-case template keys")
    void bindsByTemplate() {
        Msg91Properties properties = bind(complete());

        assertEquals("flow-marketplace-otp", properties.getSms().getFlows().get(MessageTemplate.MARKETPLACE_OTP));
        assertEquals("wa_tour_reminder", properties.getWhatsapp().getTemplates().get(MessageTemplate.TOUR_REMINDER));
        assertDoesNotThrow(() -> MessagingConfig.validate(properties));
    }

    @Test
    @DisplayName("Nothing enabled needs no settings")
    void disabledIsFine() {
        assertDoesNotThrow(() -> MessagingConfig.validate(bind(Map.of())));
    }

    @Test
    @DisplayName("An enabled channel needs the auth key and every template")
    void enabledNeedsCompleteSettings() {
        Map<String, String> noKey = complete();
        noKey.remove("msg91.auth-key");
        assertTrue(message(noKey).contains("auth-key"));

        Map<String, String> missingFlow = complete();
        missingFlow.remove("msg91.sms.flows.tour-approved");
        assertTrue(message(missingFlow).contains("TOUR_APPROVED"));

        Map<String, String> missingTemplate = complete();
        missingTemplate.remove("msg91.whatsapp.templates.marketplace-otp");
        assertTrue(message(missingTemplate).contains("MARKETPLACE_OTP"));

        Map<String, String> missingNumber = complete();
        missingNumber.remove("msg91.whatsapp.integrated-number");
        assertTrue(message(missingNumber).contains("integrated-number"));
    }

    private static String message(Map<String, String> values) {
        Msg91Properties properties = bind(values);
        return assertThrows(IllegalStateException.class, () -> MessagingConfig.validate(properties)).getMessage();
    }

    private static Map<String, String> complete() {
        Map<String, String> values = new HashMap<>();
        values.put("msg91.auth-key", "key");
        values.put("msg91.sms.enabled", "true");
        values.put("msg91.whatsapp.enabled", "true");
        values.put("msg91.whatsapp.integrated-number", "919999988888");
        for (String key : new String[]{"marketplace-otp", "tour-approved", "tour-declined", "tour-reminder"}) {
            values.put("msg91.sms.flows." + key, "flow-" + key);
            values.put("msg91.whatsapp.templates." + key, "wa_" + key.replace('-', '_'));
        }
        return values;
    }

    private static Msg91Properties bind(Map<String, String> values) {
        Binder binder = new Binder(new MapConfigurationPropertySource(values));
        return binder.bind("msg91", Bindable.ofInstance(new Msg91Properties())).orElseGet(Msg91Properties::new);
    }
}
