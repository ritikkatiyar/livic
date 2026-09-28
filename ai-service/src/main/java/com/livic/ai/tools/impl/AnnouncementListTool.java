package com.livic.ai.tools.impl;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import com.livic.ai.client.BackendClient;
import com.livic.ai.tools.AiTool;
import com.livic.ai.tools.ToolCapability;
import com.livic.ai.tools.ToolDefinition;
import com.livic.ai.tools.ToolExecutionContext;
import com.livic.ai.tools.ToolResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.util.UUID;

import static com.livic.ai.tools.impl.ToolSupport.PAGE_SIZE;
import static com.livic.ai.tools.impl.ToolSupport.params;
import static com.livic.ai.tools.impl.ToolSupport.text;

@Component
@RequiredArgsConstructor
public class AnnouncementListTool implements AiTool<AnnouncementListTool.Input> {

    private static final int MAX_CONTENT_CHARS = 300;

    public record Input(
            @JsonProperty(required = false)
            @JsonPropertyDescription("propertyId to limit the list to one property; omit for all properties")
            UUID propertyId
    ) {
    }

    record AnnouncementItem(String propertyId, String title, String category, String severity, String createdAt,
                            String content, Long readCount, Long totalRecipients) {
    }

    private static final ToolDefinition DEFINITION = new ToolDefinition(
            "announcement_list",
            "Lists recent announcements (notices) sent to residents, newest first, with how many recipients have read each.",
            Input.class,
            ToolCapability.READ,
            "ANNOUNCEMENT_VIEW");

    private final BackendClient backend;

    @Override
    public ToolDefinition definition() {
        return DEFINITION;
    }

    @Override
    public ToolResult execute(ToolExecutionContext context, Input input) {
        JsonNode page = backend.get("/api/v1/announcement/announcements",
                params("propertyId", input.propertyId(), "size", PAGE_SIZE), context.userToken());
        var view = ToolSupport.ListView.of(page, node -> new AnnouncementItem(
                text(node, "propertyId"),
                text(node, "title"),
                text(node, "category"),
                text(node, "severity"),
                text(node, "createdAt"),
                truncate(text(node, "content")),
                node.path("readCount").isNumber() ? node.path("readCount").asLong() : null,
                node.path("totalRecipientsCount").isNumber() ? node.path("totalRecipientsCount").asLong() : null));
        return ToolResult.success(view.totalCount() + " announcements; showing the " + view.shown() + " most recent.", view);
    }

    private static String truncate(String content) {
        if (content == null || content.length() <= MAX_CONTENT_CHARS) {
            return content;
        }
        return content.substring(0, MAX_CONTENT_CHARS) + "…";
    }
}
