package com.livic.platform.notification.domain;

import java.util.List;

/**
 * Pre-approved transactional message templates.
 *
 * <p>Indian carriers only deliver SMS whose text matches a DLT-registered template, so messages are never free-form.
 * {@link #text()} is the exact wording to register, with a {@code {variable}} placeholder wherever the provider
 * template has a variable. It is also what the console provider prints and what the notification log stores, so
 * development output matches what a phone receives. Keep it in sync with the registered template.
 */
public enum MessageTemplate {

    MARKETPLACE_OTP(
            "{otp} is your Livic verification code. It expires in {minutes} minutes. Do not share it with anyone. -LIVIC",
            List.of(Variable.of("otp"), Variable.of("minutes")),
            true),

    TOUR_APPROVED(
            "Hi {name}, your visit to {property} on {date} at {time} is confirmed. Details: {link} -LIVIC",
            List.of(Variable.of("name"), Variable.of("property"), Variable.of("date"), Variable.of("time"), Variable.url("link")),
            false),

    TOUR_DECLINED(
            "Hi {name}, your visit request for {property} on {date} at {time} was declined. {note} See other slots: {link} -LIVIC",
            List.of(Variable.of("name"), Variable.of("property"), Variable.of("date"), Variable.of("time"), Variable.of("note"),
                    Variable.url("link")),
            false),

    TOUR_REMINDER(
            "Reminder: your visit to {property} is on {date} at {time}. Details: {link} -LIVIC",
            List.of(Variable.of("property"), Variable.of("date"), Variable.of("time"), Variable.url("link")),
            false);

    /** DLT limit for a plain {#var#} value. */
    public static final int MAX_VARIABLE_LENGTH = 30;
    /** DLT {#url#} values are whitelisted links and may be longer than plain variables. */
    public static final int MAX_URL_LENGTH = 100;

    private final String text;
    private final List<Variable> variables;
    private final boolean sensitive;

    MessageTemplate(String text, List<Variable> variables, boolean sensitive) {
        this.text = text;
        this.variables = variables;
        this.sensitive = sensitive;
    }

    public String text() {
        return text;
    }

    public List<Variable> variables() {
        return variables;
    }

    /** Sensitive messages (one-time codes) are never stored in the notification log and never retried. */
    public boolean sensitive() {
        return sensitive;
    }

    public record Variable(String name, int maxLength) {

        static Variable of(String name) {
            return new Variable(name, MAX_VARIABLE_LENGTH);
        }

        static Variable url(String name) {
            return new Variable(name, MAX_URL_LENGTH);
        }
    }
}
