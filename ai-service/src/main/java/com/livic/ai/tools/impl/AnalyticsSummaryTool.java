package com.livic.ai.tools.impl;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import com.livic.ai.client.BackendClient;
import com.livic.ai.tools.AiTool;
import com.livic.ai.tools.ToolCapability;
import com.livic.ai.tools.ToolDefinition;
import com.livic.ai.tools.ToolExecutionContext;
import com.livic.ai.tools.ToolResult;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;

import static com.livic.ai.tools.impl.ToolSupport.params;

@Component
@RequiredArgsConstructor
public class AnalyticsSummaryTool implements AiTool<AnalyticsSummaryTool.Input> {

    public record Input(
            @JsonProperty(required = false)
            @Pattern(regexp = "\\d{4}-\\d{2}", message = "must be YYYY-MM")
            @JsonPropertyDescription("Billing month as YYYY-MM; omit for the current month")
            String billingMonth
    ) {
    }

    /**
     * The backend's growth rates are always zero and its netProfit subtracts all-time expenses from one month's
     * collections, so neither is passed on; expenses are labelled as all-time.
     */
    record Summary(String billingMonth, BigDecimal expectedRevenue, BigDecimal collectedRevenue,
                   BigDecimal collectionRatePercent, BigDecimal totalExpensesAllTime) {
    }

    private static final ToolDefinition DEFINITION = new ToolDefinition(
            "analytics_summary",
            "Rent collection across all of the user's properties for one billing month: rent expected vs collected "
                    + "and the collection rate, plus total expenses recorded to date. Amounts are in Indian rupees.",
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
        JsonNode node = backend.get("/api/v1/analytics/summary", params("billingMonth", input.billingMonth()), context.userToken());
        String month = input.billingMonth() != null ? input.billingMonth() : "current month";
        var summary = new Summary(
                month,
                amount(node, "expectedRevenue"),
                amount(node, "collectedRevenue"),
                amount(node, "collectionRate"),
                amount(node, "totalExpenses"));
        return ToolResult.success("Rent collection for " + month + ".", summary);
    }

    private static BigDecimal amount(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isNumber() ? value.decimalValue() : null;
    }
}
