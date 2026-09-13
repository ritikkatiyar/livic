package com.livic.common.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class EmailVerificationRequestedEvent extends ApplicationEvent {
    private final String recipientUserId;
    private final String code;
    private final long expiresInMinutes;

    public EmailVerificationRequestedEvent(Object source, String recipientUserId, String code, long expiresInMinutes) {
        super(source);
        this.recipientUserId = recipientUserId;
        this.code = code;
        this.expiresInMinutes = expiresInMinutes;
    }
}
