package com.livic.core.community.issue.event;

/** A resident raised an issue; one event per staff member to tell. */
public record IssueCreatedEvent(
        String issueId,
        String propertyName,
        String unitNumber,
        String creatorName,
        String title,
        String description,
        String recipientUserId
) {
}
