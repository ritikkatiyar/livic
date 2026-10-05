package com.livic.core.community.issue.event;

/** An issue was escalated, by a person or by its SLA; one event per manager to tell. */
public record IssueEscalatedEvent(
        String issueId,
        String propertyName,
        String unitNumber,
        String title,
        String reason,
        String recipientUserId
) {
}
