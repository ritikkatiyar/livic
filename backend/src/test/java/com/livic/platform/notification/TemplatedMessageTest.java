package com.livic.platform.notification;

import com.livic.platform.notification.domain.MessageTemplate;
import com.livic.platform.notification.dto.TemplatedMessage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

class TemplatedMessageTest {

    private static final Pattern PLACEHOLDER = Pattern.compile("\\{([a-z]+)}");

    @Test
    @DisplayName("Renders the template text with its variables")
    void rendersText() {
        TemplatedMessage message = TemplatedMessage.of(MessageTemplate.MARKETPLACE_OTP, Map.of("otp", "482913", "minutes", "5"));

        assertEquals("482913 is your Livic verification code. It expires in 5 minutes. Do not share it with anyone. -LIVIC",
                message.render());
    }

    @Test
    @DisplayName("Rejects a message missing a declared variable")
    void rejectsMissingVariable() {
        Map<String, String> onlyOtp = Map.of("otp", "482913");

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> TemplatedMessage.of(MessageTemplate.MARKETPLACE_OTP, onlyOtp));
        assertTrue(error.getMessage().contains("minutes"));
    }

    @Test
    @DisplayName("Cuts plain values to the DLT limit with ASCII dots, allows longer links, and drops unknown variables")
    void fitsValuesToLimits() {
        String longName = "Sunshine Residency Co-living for Working Professionals";
        String link = "https://marketplace.livic.in/market-place/my-requests";

        TemplatedMessage message = TemplatedMessage.of(MessageTemplate.TOUR_REMINDER, Map.of(
                "property", longName, "date", "Thu, 17 Sep", "time", "11:00 AM", "link", link, "extra", "ignored"));

        String property = message.variables().get("property");
        assertEquals(MessageTemplate.MAX_VARIABLE_LENGTH, property.length());
        assertTrue(property.endsWith("..."));
        assertEquals(link, message.variables().get("link"));
        assertFalse(message.variables().containsKey("extra"));
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
}
