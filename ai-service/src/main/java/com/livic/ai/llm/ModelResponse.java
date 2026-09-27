package com.livic.ai.llm;

import java.util.List;

public record ModelResponse(
        String text,
        List<ToolCall> toolCalls,
        TokenUsage usage,
        String model
) {

    public boolean hasToolCalls() {
        return toolCalls != null && !toolCalls.isEmpty();
    }
}
