package com.livic.ai.tools;

import com.livic.ai.agent.AgentContext;
import com.livic.ai.agent.AgentContext.PropertyAccess;
import com.livic.ai.agent.AgentDefinition;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ToolRegistryTest {

    private final ToolRegistry registry = new ToolRegistry(List.of(
            tool("issue_list", "ISSUE_VIEW"),
            tool("analytics_summary", "ANALYTICS_VIEW"),
            tool("help", null),
            tool("not_allowed", null)));

    private final AgentDefinition agent = new AgentDefinition(
            "test", "prompt", List.of("issue_list", "analytics_summary", "help", "missing_tool"), 8, 0.2);

    @Test
    void offersOnlyAllowlistedToolsTheCallerHasAPermissionFor() {
        var context = contextWith(Set.of("ISSUE_VIEW"), Set.of("PROPERTY_VIEW"));

        assertThat(names(registry.availableFor(agent, context))).containsExactly("issue_list", "help");
    }

    @Test
    void aPermissionOnAnyOneOfTheCallersPropertiesIsEnough() {
        var context = contextWith(Set.of(), Set.of("ANALYTICS_VIEW"));

        assertThat(names(registry.availableFor(agent, context))).containsExactly("analytics_summary", "help");
    }

    @Test
    void callerWithNoPropertiesGetsOnlyToolsThatNeedNoPermission() {
        var context = new AgentContext(UUID.randomUUID(), "token", "req", Map.of());

        assertThat(names(registry.availableFor(agent, context))).containsExactly("help");
    }

    @Test
    void rejectsDuplicateToolNames() {
        assertThatThrownBy(() -> new ToolRegistry(List.of(tool("dup", null), tool("dup", null))))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("dup");
    }

    private static AgentContext contextWith(Set<String> firstPropertyCodes, Set<String> secondPropertyCodes) {
        return new AgentContext(UUID.randomUUID(), "token", "req", Map.of(
                UUID.randomUUID(), new PropertyAccess("Sunrise Apartments", firstPropertyCodes),
                UUID.randomUUID(), new PropertyAccess("Lake View", secondPropertyCodes)));
    }

    private static List<String> names(List<AiTool<?>> tools) {
        return tools.stream().map(t -> t.definition().name()).toList();
    }

    private static AiTool<Object> tool(String name, String permission) {
        var definition = new ToolDefinition(name, "test tool", Object.class, ToolCapability.READ, permission);
        return new AiTool<>() {
            @Override
            public ToolDefinition definition() {
                return definition;
            }

            @Override
            public ToolResult execute(ToolExecutionContext context, Object input) {
                return ToolResult.success("ok", null);
            }
        };
    }
}
