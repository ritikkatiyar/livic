package com.livic.ai.agent;

import java.util.List;

/**
 * Static blueprint of an agent: its instructions, which tools it may consider and its limits.
 *
 * @param systemPrompt may contain {@code {today}} and {@code {properties}}, filled in per request
 */
public record AgentDefinition(
        String id,
        String systemPrompt,
        List<String> allowedToolNames,
        int maxSteps,
        double temperature
) {
}
