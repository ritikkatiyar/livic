package com.livic.ai.llm;

/**
 * The runtime's only way to reach a model. Tool calls come back in the response instead of being
 * executed by the provider library, so the runtime owns the loop, the policy checks and the audit.
 */
public interface LlmGateway {

    ModelResponse chat(ModelRequest request);
}
