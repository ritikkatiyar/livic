package com.livic.ai.llm;

import com.livic.ai.tools.ToolDefinition;

import java.util.List;

public record ModelRequest(
        List<ModelMessage> messages,
        List<ToolDefinition> tools,
        double temperature
) {
}
