package com.livic.core.community.issue.dto;

import com.livic.core.community.issue.domain.IssueCategory;
import com.livic.core.community.issue.domain.IssueEscalationStatus;
import com.livic.core.community.issue.domain.IssuePriority;
import com.livic.core.community.issue.domain.IssueScope;
import com.livic.core.community.issue.domain.IssueStatus;
import com.livic.core.community.issue.domain.IssueTimelineEntryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class IssueDTOs {

    public record CreateIssueRequest(
            @NotNull(message = "Property ID is required") UUID propertyId,
            UUID unitId,
            UUID leaseId,
            UUID tenantId,
            @NotBlank(message = "Title is required") String title,
            @NotBlank(message = "Description is required") String description,
            @NotNull(message = "Category is required") IssueCategory category,
            @NotNull(message = "Priority is required") IssuePriority priority,
            @NotNull(message = "Scope is required") IssueScope scope,
            @NotBlank(message = "Assigned contact name is required") String assignedContactName,
            String assignedContactPhone
    ) {}

    public record UpdateStatusRequest(
            @NotNull(message = "Status is required") IssueStatus status,
            String comment
    ) {}

    public record EscalateRequest(
            @NotBlank(message = "Reason for escalation is required") String reason
    ) {}

    public record CreateCommentRequest(
            @NotBlank(message = "Comment content is required") String content
    ) {}

    public record IssueResponse(
            UUID id,
            UUID propertyId,
            UUID unitId,
            UUID leaseId,
            UUID tenantId,
            UUID reportedByUserId,
            String title,
            String description,
            IssueCategory category,
            IssuePriority priority,
            IssueStatus status,
            IssueScope scope,
            IssueEscalationStatus escalationStatus,
            int escalationLevel,
            String assignedContactName,
            String assignedContactPhone,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            String ticketNumber,
            List<IssueTimelineResponse> timeline
    ) {}

    public record IssueTimelineResponse(
            UUID id,
            UUID authorUserId,
            String authorName,
            IssueTimelineEntryType entryType,
            String content,
            LocalDateTime createdAt
    ) {}
}
