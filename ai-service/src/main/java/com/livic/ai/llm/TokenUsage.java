package com.livic.ai.llm;

public record TokenUsage(int inputTokens, int outputTokens) {

    public static final TokenUsage ZERO = new TokenUsage(0, 0);

    public TokenUsage plus(TokenUsage other) {
        return new TokenUsage(inputTokens + other.inputTokens, outputTokens + other.outputTokens);
    }
}
