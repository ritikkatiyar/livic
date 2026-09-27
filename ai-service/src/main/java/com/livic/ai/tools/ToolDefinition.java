package com.livic.ai.tools;

/**
 * How a tool is described to the model and to the policy checks.
 *
 * @param inputType          DTO the model's JSON arguments are bound to; its schema is what the model sees
 * @param requiredPermission property permission code the caller needs on at least one property, or null
 */
public record ToolDefinition(
        String name,
        String description,
        Class<?> inputType,
        ToolCapability capability,
        String requiredPermission
) {
}
