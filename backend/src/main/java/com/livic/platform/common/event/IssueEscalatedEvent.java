package com.livic.platform.common.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class IssueEscalatedEvent extends ApplicationEvent {
    private final String issueId;
    private final String propertyName;
    private final String unitNumber;
    private final String title;
    private final String reason;
    private final String recipientUserId;

    public IssueEscalatedEvent(Object source, String issueId, String propertyName, String unitNumber,
                               String title, String reason, String recipientUserId) {
        super(source);
        this.issueId = issueId;
        this.propertyName = propertyName;
        this.unitNumber = unitNumber;
        this.title = title;
        this.reason = reason;
        this.recipientUserId = recipientUserId;
    }
}
