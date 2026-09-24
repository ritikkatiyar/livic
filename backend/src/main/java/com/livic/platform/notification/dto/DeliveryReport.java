package com.livic.platform.notification.dto;

import com.livic.platform.notification.domain.NotificationChannel;

import java.util.EnumMap;
import java.util.Map;

/** What happened on each channel a message was meant for. */
public record DeliveryReport(Map<NotificationChannel, Outcome> outcomes) {

    public enum Outcome {
        SENT,
        FAILED,
        /** Not attempted: invalid number, no working gateway, or an earlier channel already delivered. */
        SKIPPED
    }

    public DeliveryReport {
        outcomes = outcomes.isEmpty() ? Map.of() : Map.copyOf(new EnumMap<>(outcomes));
    }

    public boolean anySent() {
        return outcomes.containsValue(Outcome.SENT);
    }

    public Outcome outcome(NotificationChannel channel) {
        return outcomes.getOrDefault(channel, Outcome.SKIPPED);
    }
}
