package com.livic.ai.tools;

/**
 * A capability the model may ask for. Implementations call the backend with the caller's
 * token and return a lean {@link ToolResult}; they never decide when they run or who may run them.
 */
public interface AiTool<I> {

    ToolDefinition definition();

    ToolResult execute(ToolExecutionContext context, I input);
}
