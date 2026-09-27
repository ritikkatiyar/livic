package com.livic.ai.llm;

/** A tool invocation the model asked for; arguments are untrusted JSON. */
public record ToolCall(String id, String name, String argumentsJson) {
}
