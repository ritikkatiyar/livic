package com.livic.platform.notification;

import com.livic.platform.notification.domain.MessageTemplate;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.dto.TemplatedMessage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

class TemplatedMessageTest {

    private static final Pattern PLACEHOLDER = Pattern.compile("\\{([a-z]+)}");
    private static final String LONG_NAME = "Sunshine Residency Co-living for Working Professionals";
    private static final String LINK = "https://marketplace.livic.in/market-place/my-requests";

    @Test
    @DisplayName("Renders the template text with its variables")
    void rendersText() {
        TemplatedMessage message = TemplatedMessage.of(MessageTemplate.MARKETPLACE_OTP, Map.of("otp", "482913", "minutes", "5"));

        assertEquals("482913 is your Livic verification code. It expires in 5 minutes. Do not share it with anyone. -LIVIC",
                message.render());
    }

    @Test
    @DisplayName("Rejects a message missing a declared variable and drops unknown ones")
    void validatesVariables() {
        Map<String, String> onlyOtp = Map.of("otp", "482913");
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> TemplatedMessage.of(MessageTemplate.MARKETPLACE_OTP, onlyOtp));
        assertTrue(error.getMessage().contains("minutes"));

        TemplatedMessage message = TemplatedMessage.of(MessageTemplate.MARKETPLACE_OTP, Map.of("otp", "1", "minutes", "5", "extra", "x"));
        assertFalse(message.variables().containsKey("extra"));
    }

    @Test
    @DisplayName("SMS cuts plain values to the DLT limit with ASCII dots and allows longer links")
    void fitsSmsLimits() {
        TemplatedMessage sms = reminder(LONG_NAME).forChannel(NotificationChannel.SMS);

        String property = sms.variables().get("property");
        assertEquals(MessageTemplate.MAX_SMS_VARIABLE_LENGTH, property.length());
        assertTrue(property.endsWith("..."));
        assertEquals(LINK, sms.variables().get("link"));
    }

    @Test
    @DisplayName("WhatsApp keeps longer values but flattens newlines, which Meta rejects in parameters")
    void fitsWhatsAppLimits() {
        TemplatedMessage whatsapp = reminder(LONG_NAME + "\n\n  Block B").forChannel(NotificationChannel.WHATSAPP);

        assertEquals(LONG_NAME + " Block B", whatsapp.variables().get("property"));
        assertEquals(List.of(LONG_NAME + " Block B", "Thu, 17 Sep", "11:00 AM", LINK), whatsapp.orderedValues());
    }

    @Test
    @DisplayName("Every placeholder in every template is a declared variable, and every variable is used")
    void templatesAndVariablesAgree() {
        for (MessageTemplate template : MessageTemplate.values()) {
            Matcher matcher = PLACEHOLDER.matcher(template.text());
            long placeholders = 0;
            while (matcher.find()) {
                String name = matcher.group(1);
                placeholders++;
                assertTrue(template.variables().stream().anyMatch(v -> v.name().equals(name)), template + " uses undeclared {" + name + "}");
            }
            assertEquals(template.variables().size(), placeholders, template + " declares variables it doesn't use");
        }
    }

    private static TemplatedMessage reminder(String property) {
        return TemplatedMessage.of(MessageTemplate.TOUR_REMINDER, Map.of(
                "property", property, "date", "Thu, 17 Sep", "time", "11:00 AM", "link", LINK));
    }
}
