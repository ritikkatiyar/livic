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

import java.math.BigDecimal;

import static com.livic.ai.tools.impl.ToolSupport.PAGE_SIZE;
import static com.livic.ai.tools.impl.ToolSupport.params;
import static com.livic.ai.tools.impl.ToolSupport.text;

@Component
@RequiredArgsConstructor
public class AnalyticsDefaultersTool implements AiTool<AnalyticsDefaultersTool.Input> {

    public record Input() {
    }

    record Defaulter(String residentName, String unitNumber, String propertyName, String blockName,
                     int daysOverdue, BigDecimal amountDue) {
    }

    private static final ToolDefinition DEFINITION = new ToolDefinition(
            "analytics_defaulters",
            "Lists residents with overdue bills across the user's properties: unit, property, days overdue and amount due in rupees.",
            Input.class,
            ToolCapability.READ,
            "ANALYTICS_VIEW");

    private final BackendClient backend;

    @Override
    public ToolDefinition definition() {
        return DEFINITION;
    }

    @Override
    public ToolResult execute(ToolExecutionContext context, Input input) {
        JsonNode page = backend.get("/api/v1/analytics/defaulters", params("size", PAGE_SIZE), context.userToken());
        var view = ToolSupport.ListView.of(page, node -> new Defaulter(
                text(node, "tenantName"),
                text(node, "unitNumber"),
                text(node, "propertyName"),
                text(node, "blockName"),
                node.path("daysOverdue").asInt(0),
                node.path("amountDue").isNumber() ? node.path("amountDue").decimalValue() : null));
        if (view.totalCount() == 0) {
            return ToolResult.success("No residents have overdue bills.", view);
        }
        BigDecimal shownTotal = view.items().stream()
                .map(Defaulter::amountDue)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return ToolResult.success(view.totalCount() + " residents have overdue bills; the " + view.shown()
                + " shown owe ₹" + shownTotal.toPlainString() + " in total.", view);
    }
}
