package com.livic.ai.tools.impl;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import com.livic.ai.client.BackendClient;
import com.livic.ai.tools.AiTool;
import com.livic.ai.tools.ToolCapability;
import com.livic.ai.tools.ToolDefinition;
import com.livic.ai.tools.ToolExecutionContext;
import com.livic.ai.tools.ToolResult;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.StreamSupport;

import static com.livic.ai.tools.impl.ToolSupport.text;

@Component
@RequiredArgsConstructor
public class IssueGetTool implements AiTool<IssueGetTool.Input> {

    private static final int MAX_TIMELINE_ENTRIES = 10;

    public record Input(
            @NotNull
            @JsonPropertyDescription("The issueId returned by issue_list")
            UUID issueId
    ) {
    }

    record TimelineEntry(String author, String type, String content, String createdAt) {
    }

    record IssueDetail(String issueId, String ticketNumber, String propertyId, String blockName, String title,
                       String description, String category, String priority, String status, String escalationStatus,
                       int escalationLevel, String assignedTo, String createdAt, String updatedAt,
                       List<TimelineEntry> latestTimeline) {
    }

    private static final ToolDefinition DEFINITION = new ToolDefinition(
            "issue_get",
            "Gets one maintenance issue in full: description, assignee and its latest timeline entries.",
            Input.class,
            ToolCapability.READ,
            "ISSUE_VIEW");

    private final BackendClient backend;

    @Override
    public ToolDefinition definition() {
        return DEFINITION;
    }

    @Override
    public ToolResult execute(ToolExecutionContext context, Input input) {
        JsonNode issue = backend.get("/api/v1/issues/" + input.issueId(), Map.of(), context.userToken());
        List<JsonNode> timeline = StreamSupport.stream(issue.path("timeline").spliterator(), false).toList();
        List<TimelineEntry> latest = timeline.subList(Math.max(0, timeline.size() - MAX_TIMELINE_ENTRIES), timeline.size())
                .stream()
                .map(entry -> new TimelineEntry(
                        text(entry, "authorName"), text(entry, "entryType"), text(entry, "content"), text(entry, "createdAt")))
                .toList();
        var detail = new IssueDetail(
                text(issue, "id"),
                text(issue, "ticketNumber"),
                text(issue, "propertyId"),
                text(issue, "blockName"),
                text(issue, "title"),
                text(issue, "description"),
                text(issue, "category"),
                text(issue, "priority"),
                text(issue, "status"),
                text(issue, "escalationStatus"),
                issue.path("escalationLevel").asInt(0),
                text(issue, "assignedContactName"),
                text(issue, "createdAt"),
                text(issue, "updatedAt"),
                latest);
        return ToolResult.success("Issue " + detail.ticketNumber() + " is " + detail.status() + ".", detail);
    }
}
