package com.livic.ai.llm;

import java.util.List;

/** Provider-neutral conversation turns; the adapter maps them to the provider's message types. */
public sealed interface ModelMessage {

    record SystemPrompt(String text) implements ModelMessage {
    }

    record UserText(String text) implements ModelMessage {
    }

    record AssistantTurn(String text, List<ToolCall> toolCalls) implements ModelMessage {
    }

    record ToolResults(List<ToolCallResult> results) implements ModelMessage {
    }

    record ToolCallResult(String callId, String toolName, String content) {
    }
}
