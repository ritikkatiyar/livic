package com.livic.platform.notification.dto;

import com.livic.platform.notification.domain.MessageTemplate;
import com.livic.platform.notification.domain.MessageTemplate.Variable;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * A template plus its variable values, ready for a provider.
 *
 * <p>Every variable the template declares must be present (blank is allowed). Values longer than the variable's
 * limit are cut with "..." so the carrier doesn't reject the message; ASCII keeps the SMS in the cheaper GSM encoding.
 */
public record TemplatedMessage(MessageTemplate template, Map<String, String> variables) {

    private static final String ELLIPSIS = "...";

    public TemplatedMessage {
        if (template == null) {
            throw new IllegalArgumentException("template is required");
        }
        Map<String, String> fitted = new LinkedHashMap<>();
        for (Variable variable : template.variables()) {
            if (variables == null || !variables.containsKey(variable.name())) {
                throw new IllegalArgumentException("Missing variable '" + variable.name() + "' for template " + template);
            }
            fitted.put(variable.name(), fit(variables.get(variable.name()), variable.maxLength()));
        }
        variables = Map.copyOf(fitted);
    }

    public static TemplatedMessage of(MessageTemplate template, Map<String, String> variables) {
        return new TemplatedMessage(template, variables);
    }

    /** The message text as the recipient sees it. */
    public String render() {
        String text = template.text();
        for (Variable variable : template.variables()) {
            text = text.replace("{" + variable.name() + "}", variables.get(variable.name()));
        }
        return text;
    }

    private static String fit(String value, int maxLength) {
        String trimmed = value == null ? "" : value.strip();
        if (trimmed.length() <= maxLength) {
            return trimmed;
        }
        return trimmed.substring(0, maxLength - ELLIPSIS.length()).stripTrailing() + ELLIPSIS;
    }
}
