package com.livic.ai.agent;

import com.livic.ai.llm.TokenUsage;

import java.util.UUID;

public record AgentResult(
        UUID executionId,
        ExecutionStatus status,
        String responseText,
        int steps,
        TokenUsage usage
) {
}
