package com.livic.ai.tools;

import com.livic.ai.agent.AgentContext;
import com.livic.ai.agent.AgentDefinition;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class ToolRegistry {

    private final Map<String, AiTool<?>> toolsByName = new LinkedHashMap<>();

    public ToolRegistry(List<AiTool<?>> tools) {
        for (AiTool<?> tool : tools) {
            String name = tool.definition().name();
            if (toolsByName.putIfAbsent(name, tool) != null) {
                throw new IllegalStateException("Duplicate AI tool name: " + name);
            }
        }
    }

    /**
     * The tools this caller may use with this agent: named in the agent's allowlist and covered by a
     * permission the caller holds on at least one property. Anything else is never shown to the model.
     * The backend still checks the specific property on every call.
     */
    public List<AiTool<?>> availableFor(AgentDefinition agent, AgentContext context) {
        return agent.allowedToolNames().stream()
                .map(toolsByName::get)
                .filter(Objects::nonNull)
                .filter(tool -> context.hasPermissionOnAnyProperty(tool.definition().requiredPermission()))
                .toList();
    }
}
