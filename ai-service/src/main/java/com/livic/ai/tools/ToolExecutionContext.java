package com.livic.ai.tools;

import java.util.UUID;

/**
 * Who a single tool call runs as. Built by the runtime from the verified request, never from model output.
 */
public record ToolExecutionContext(
        UUID userId,
        String userToken,
        UUID executionId,
        int stepNumber,
        String requestId
) {

    @Override
    public String toString() {
        return "ToolExecutionContext[userId=%s, executionId=%s, stepNumber=%d, requestId=%s]"
                .formatted(userId, executionId, stepNumber, requestId);
    }
}
