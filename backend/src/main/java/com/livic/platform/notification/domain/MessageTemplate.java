package com.livic.platform.notification.domain;

import java.util.List;

/**
 * Pre-approved transactional message templates, sent by SMS and/or WhatsApp.
 *
 * <p>Carriers only deliver SMS whose text matches a DLT-registered template, and WhatsApp only delivers
 * Meta-approved templates, so messages are never free-form. {@link #text()} is the canonical wording, with a
 * {@code {variable}} placeholder for each variable: register it on DLT (each placeholder as a variable) and on
 * WhatsApp (placeholders numbered {{1}}, {{2}}... in {@link #variables()} order). The console provider and the
 * notification log render it too, so development output matches what a phone receives.
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

    /** DLT limit for a plain SMS {#var#} value. */
    public static final int MAX_SMS_VARIABLE_LENGTH = 30;
    /** DLT {#url#} values are whitelisted links and may be longer than plain variables. */
    public static final int MAX_SMS_URL_LENGTH = 100;
    /** WhatsApp template parameters have no DLT limit; this keeps a long landlord note from bloating the message. */
    public static final int MAX_WHATSAPP_VARIABLE_LENGTH = 300;

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

    /**
     * @param url links; on SMS they are registered as DLT {#url#} variables, which allow longer values
     */
    public record Variable(String name, boolean url) {

        static Variable of(String name) {
            return new Variable(name, false);
        }

        static Variable url(String name) {
            return new Variable(name, true);
        }

        public int maxLength(NotificationChannel channel) {
            if (channel == NotificationChannel.SMS) {
                return url ? MAX_SMS_URL_LENGTH : MAX_SMS_VARIABLE_LENGTH;
            }
            return MAX_WHATSAPP_VARIABLE_LENGTH;
        }
    }
}
