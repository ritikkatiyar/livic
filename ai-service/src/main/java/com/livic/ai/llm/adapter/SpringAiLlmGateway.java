package com.livic.ai.llm.adapter;

import com.livic.ai.llm.LlmGateway;
import com.livic.ai.llm.ModelMessage;
import com.livic.ai.llm.ModelRequest;
import com.livic.ai.llm.ModelResponse;
import com.livic.ai.llm.TokenUsage;
import com.livic.ai.llm.ToolCall;
import com.livic.ai.tools.ToolDefinition;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.ToolResponseMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.model.tool.ToolCallingChatOptions;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.definition.DefaultToolDefinition;
import org.springframework.ai.util.json.schema.JsonSchemaGenerator;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

/**
 * The one place Spring AI is used. Tools are handed to the model as definitions only, with the
 * provider's own tool execution switched off, so tool calls come back to AgentRuntime.
 */
@Component
public class SpringAiLlmGateway implements LlmGateway {

    private final ObjectProvider<ChatModel> chatModel;
    private final Map<Class<?>, String> schemaCache = new ConcurrentHashMap<>();

    public SpringAiLlmGateway(ObjectProvider<ChatModel> chatModel) {
        this.chatModel = chatModel;
    }

    @Override
    public ModelResponse chat(ModelRequest request) {
        ChatModel model = chatModel.getIfAvailable();
        if (model == null) {
            throw new IllegalStateException("No chat model is configured; set SPRING_AI_MODEL_CHAT");
        }
        List<Message> messages = request.messages().stream().map(SpringAiLlmGateway::toMessage).toList();
        return toModelResponse(model.call(new Prompt(messages, options(model, request))));
    }

    /** Starts from the model's own defaults so provider-specific settings (model name, safety) carry over. */
    private ChatOptions options(ChatModel model, ModelRequest request) {
        ChatOptions defaults = model.getDefaultOptions();
        ChatOptions.Builder<?> builder = defaults != null ? defaults.mutate() : ToolCallingChatOptions.builder();
        builder.temperature(request.temperature());
        if (builder instanceof ToolCallingChatOptions.Builder<?> toolOptions) {
            List<ToolCallback> callbacks = request.tools().stream()
                    .map(tool -> (ToolCallback) new DefinitionOnlyToolCallback(toSpringDefinition(tool)))
                    .toList();
            toolOptions.toolCallbacks(callbacks);
            toolOptions.internalToolExecutionEnabled(false);
        } else if (!request.tools().isEmpty()) {
            throw new IllegalStateException(model.getClass().getSimpleName() + " does not support tool calling");
        }
        return builder.build();
    }

    private DefaultToolDefinition toSpringDefinition(ToolDefinition tool) {
        String schema = schemaCache.computeIfAbsent(tool.inputType(), JsonSchemaGenerator::generateForType);
        return new DefaultToolDefinition(tool.name(), tool.description(), schema);
    }

    private static Message toMessage(ModelMessage message) {
        return switch (message) {
            case ModelMessage.SystemPrompt system -> new SystemMessage(system.text());
            case ModelMessage.UserText user -> new UserMessage(user.text());
            case ModelMessage.AssistantTurn assistant -> AssistantMessage.builder()
                    .content(assistant.text())
                    .toolCalls(assistant.toolCalls().stream()
                            .map(call -> new AssistantMessage.ToolCall(call.id(), "function", call.name(), call.argumentsJson()))
                            .toList())
                    .build();
            case ModelMessage.ToolResults results -> ToolResponseMessage.builder()
                    .responses(results.results().stream()
                            .map(result -> new ToolResponseMessage.ToolResponse(result.callId(), result.toolName(), result.content()))
                            .toList())
                    .build();
        };
    }

    /** A provider may split one turn across generations, so text and tool calls are gathered from all of them. */
    private static ModelResponse toModelResponse(ChatResponse response) {
        List<AssistantMessage> outputs = response.getResults().stream()
                .map(Generation::getOutput)
                .filter(Objects::nonNull)
                .toList();
        String text = outputs.stream()
                .map(AssistantMessage::getText)
                .filter(Objects::nonNull)
                .reduce((first, second) -> first + second)
                .orElse(null);
        List<ToolCall> toolCalls = outputs.stream()
                .flatMap(output -> output.getToolCalls().stream())
                .map(call -> new ToolCall(call.id(), call.name(), call.arguments()))
                .toList();

        Usage usage = response.getMetadata().getUsage();
        TokenUsage tokens = usage == null ? TokenUsage.ZERO
                : new TokenUsage(orZero(usage.getPromptTokens()), orZero(usage.getCompletionTokens()));
        return new ModelResponse(text, toolCalls, tokens, response.getMetadata().getModel());
    }

    private static int orZero(Integer value) {
        return value == null ? 0 : value;
    }

    private record DefinitionOnlyToolCallback(DefaultToolDefinition definition) implements ToolCallback {

        @Override
        public DefaultToolDefinition getToolDefinition() {
            return definition;
        }

        @Override
        public String call(String toolInput) {
            throw new UnsupportedOperationException("Tools are executed by AgentRuntime, not by the model client");
        }
    }
}
