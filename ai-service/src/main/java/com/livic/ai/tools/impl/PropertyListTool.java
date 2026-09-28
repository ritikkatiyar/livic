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

import static com.livic.ai.tools.impl.ToolSupport.PAGE_SIZE;
import static com.livic.ai.tools.impl.ToolSupport.params;
import static com.livic.ai.tools.impl.ToolSupport.text;

@Component
@RequiredArgsConstructor
public class PropertyListTool implements AiTool<PropertyListTool.Input> {

    public record Input(
            @JsonProperty(required = false)
            @JsonPropertyDescription("Optional text to match against property names; omit to list all properties")
            String search
    ) {
    }

    record PropertyItem(String propertyId, String name, String address, String city, Integer totalFloors, boolean active) {
    }

    private static final ToolDefinition DEFINITION = new ToolDefinition(
            "property_list",
            "Lists the properties (buildings) the user manages, with address, city, floors and whether each is active.",
            Input.class,
            ToolCapability.READ,
            "PROPERTY_VIEW");

    private final BackendClient backend;

    @Override
    public ToolDefinition definition() {
        return DEFINITION;
    }

    @Override
    public ToolResult execute(ToolExecutionContext context, Input input) {
        JsonNode page = backend.get("/api/v1/properties", params("search", input.search(), "size", PAGE_SIZE), context.userToken());
        var view = ToolSupport.ListView.of(page, node -> new PropertyItem(
                text(node, "id"),
                text(node, "name"),
                text(node, "address"),
                text(node, "city"),
                node.path("totalFloors").isNumber() ? node.path("totalFloors").asInt() : null,
                node.path("isActive").asBoolean(node.path("active").asBoolean(true))));
        return ToolResult.success("Found " + view.totalCount() + " properties.", view);
    }
}
