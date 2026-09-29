package com.livic.platform.notification.dto;

import com.livic.platform.notification.domain.MessageTemplate;
import com.livic.platform.notification.domain.MessageTemplate.Variable;
import com.livic.platform.notification.domain.NotificationChannel;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * A template plus its variable values.
 *
 * <p>Every variable the template declares must be present (blank is allowed); unknown ones are dropped. Values are
 * kept whole here; {@link #forChannel} cuts them to what the channel accepts.
 */
public record TemplatedMessage(MessageTemplate template, Map<String, String> variables) {

    private static final String ELLIPSIS = "...";

    public TemplatedMessage {
        if (template == null) {
            throw new IllegalArgumentException("template is required");
        }
        Map<String, String> declared = new LinkedHashMap<>();
        for (Variable variable : template.variables()) {
            if (variables == null || !variables.containsKey(variable.name())) {
                throw new IllegalArgumentException("Missing variable '" + variable.name() + "' for template " + template);
            }
            String value = variables.get(variable.name());
            declared.put(variable.name(), value == null ? "" : value);
        }
        variables = Map.copyOf(declared);
    }

    public static TemplatedMessage of(MessageTemplate template, Map<String, String> variables) {
        return new TemplatedMessage(template, variables);
    }

    /**
     * The message as it can be sent on a channel. Whitespace runs (including newlines, which WhatsApp rejects in
     * parameters) become single spaces, and values over the channel's limit are cut with "..." (ASCII keeps an SMS in
     * the cheaper GSM encoding).
     */
    public TemplatedMessage forChannel(NotificationChannel channel) {
        Map<String, String> fitted = new LinkedHashMap<>();
        for (Variable variable : template.variables()) {
            fitted.put(variable.name(), fit(variables.get(variable.name()), variable.maxLength(channel)));
        }
        return new TemplatedMessage(template, fitted);
    }

    /** Values in the template's variable order, for providers that take positional parameters. */
    public List<String> orderedValues() {
        return template.variables().stream().map(variable -> variables.get(variable.name())).toList();
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
        String flat = value.strip().replaceAll("\\s+", " ");
        if (flat.length() <= maxLength) {
            return flat;
        }
        return flat.substring(0, maxLength - ELLIPSIS.length()).stripTrailing() + ELLIPSIS;
    }
}
