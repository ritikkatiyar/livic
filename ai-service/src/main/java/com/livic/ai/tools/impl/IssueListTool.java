package com.livic.ai.tools.impl;

import com.livic.ai.client.BackendClient;
import com.livic.ai.tools.AiTool;
import com.livic.ai.tools.ToolCapability;
import com.livic.ai.tools.ToolDefinition;
import com.livic.ai.tools.ToolExecutionContext;
import com.livic.ai.tools.ToolResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import static com.livic.ai.tools.impl.ToolSupport.PAGE_SIZE;
import static com.livic.ai.tools.impl.ToolSupport.params;
import static com.livic.ai.tools.impl.ToolSupport.text;

@Component
@RequiredArgsConstructor
public class IssueListTool implements AiTool<IssueListTool.Input> {

    public record Input() {
    }

    record IssueItem(String issueId, String ticketNumber, String propertyId, String blockName, String title,
                     String category, String priority, String status, String escalationStatus, String createdAt,
                     String latestUpdate, String latestUpdateAt) {
    }

    private static final ToolDefinition DEFINITION = new ToolDefinition(
            "issue_list",
            "Lists the most recent maintenance issues and complaints across the user's properties, newest first, "
                    + "with ticket number, category, priority, status, escalation and the latest update on each. "
                    + "Use issue_get for the full description and history of one issue.",
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
        JsonNode page = backend.get("/api/v1/issues", params("size", PAGE_SIZE), context.userToken());
        var view = ToolSupport.ListView.of(page, node -> {
            JsonNode timeline = node.path("timeline");
            JsonNode latest = timeline.isEmpty() ? timeline : timeline.get(timeline.size() - 1);
            return new IssueItem(
                    text(node, "id"),
                    text(node, "ticketNumber"),
                    text(node, "propertyId"),
                    text(node, "blockName"),
                    text(node, "title"),
                    text(node, "category"),
                    text(node, "priority"),
                    text(node, "status"),
                    text(node, "escalationStatus"),
                    text(node, "createdAt"),
                    text(latest, "content"),
                    text(latest, "createdAt"));
        });
        return ToolResult.success(view.totalCount() + " issues in total; showing the " + view.shown() + " most recent.", view);
    }
}
