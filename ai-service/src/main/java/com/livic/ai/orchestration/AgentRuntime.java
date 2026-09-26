package com.livic.ai.orchestration;

import com.livic.ai.agent.AgentContext;
import com.livic.ai.agent.AgentDefinition;
import com.livic.ai.agent.AgentResult;
import com.livic.ai.agent.ExecutionStatus;
import com.livic.ai.client.BackendException;
import com.livic.ai.llm.LlmGateway;
import com.livic.ai.llm.ModelMessage;
import com.livic.ai.llm.ModelRequest;
import com.livic.ai.llm.ModelResponse;
import com.livic.ai.llm.TokenUsage;
import com.livic.ai.llm.ToolCall;
import com.livic.ai.persistence.AgentExecution;
import com.livic.ai.persistence.AgentExecutionRepository;
import com.livic.ai.persistence.ToolExecutionRecord;
import com.livic.ai.persistence.ToolExecutionRecordRepository;
import com.livic.ai.tools.AiTool;
import com.livic.ai.tools.ToolCapability;
import com.livic.ai.tools.ToolDefinition;
import com.livic.ai.tools.ToolExecutionContext;
import com.livic.ai.tools.ToolRegistry;
import com.livic.ai.tools.ToolResult;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Runs one agent turn: model → tool calls → observations → model, until the model answers or the step
 * limit is hit. Stateless; every step is written to ai_execution_tbl / ai_tool_execution_record_tbl.
 * No transaction spans the loop, so model latency never holds a database connection.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AgentRuntime {

    static final String FAILURE_REPLY = "Sorry, I couldn't complete that right now. Please try again in a moment.";
    static final String EMPTY_REPLY = "I couldn't find an answer to that.";

    private final LlmGateway llm;
    private final ToolRegistry toolRegistry;
    private final AgentExecutionRepository executions;
    private final ToolExecutionRecordRepository toolRecords;
    private final ObjectMapper objectMapper;
    private final Validator validator;

    public AgentResult run(AgentDefinition agent, AgentContext context, String userMessage) {
        AgentExecution execution = executions.save(AgentExecution.start(context.userId(), agent.id(), userMessage));

        Map<String, AiTool<?>> tools = new LinkedHashMap<>();
        toolRegistry.availableFor(agent, context).forEach(tool -> tools.put(tool.definition().name(), tool));
        List<ToolDefinition> definitions = tools.values().stream().map(AiTool::definition).toList();

        List<ModelMessage> messages = new ArrayList<>();
        messages.add(new ModelMessage.SystemPrompt(systemPrompt(agent, context)));
        messages.add(new ModelMessage.UserText(userMessage));

        TokenUsage usage = TokenUsage.ZERO;
        String model = null;
        int step = 0;
        try {
            while (step < agent.maxSteps()) {
                step++;
                ModelResponse response = llm.chat(new ModelRequest(List.copyOf(messages), definitions, agent.temperature()));
                usage = usage.plus(response.usage());
                model = response.model();

                if (!response.hasToolCalls()) {
                    String reply = response.text() == null || response.text().isBlank() ? EMPTY_REPLY : response.text();
                    return finish(execution, ExecutionStatus.COMPLETED, reply, null, step, usage, model);
                }

                messages.add(new ModelMessage.AssistantTurn(response.text(), response.toolCalls()));
                List<ModelMessage.ToolCallResult> results = new ArrayList<>();
                for (ToolCall call : response.toolCalls()) {
                    var toolContext = new ToolExecutionContext(
                            context.userId(), context.userToken(), execution.getId(), step, context.requestId());
                    ToolResult result = invokeAndRecord(tools.get(call.name()), call, toolContext);
                    results.add(new ModelMessage.ToolCallResult(call.id(), call.name(), toJson(result.toModelView())));
                }
                messages.add(new ModelMessage.ToolResults(results));
            }
            return finish(execution, ExecutionStatus.FAILED, FAILURE_REPLY, "MAX_STEPS_EXCEEDED", step, usage, model);
        } catch (RuntimeException e) {
            log.error("Agent execution {} failed at step {}", execution.getId(), step, e);
            return finish(execution, ExecutionStatus.FAILED, FAILURE_REPLY, e.getMessage(), step, usage, model);
        }
    }

    private ToolResult invokeAndRecord(AiTool<?> tool, ToolCall call, ToolExecutionContext context) {
        long startedAt = System.nanoTime();
        ToolResult result = invoke(tool, call, context);
        long durationMs = (System.nanoTime() - startedAt) / 1_000_000;
        String output = result.data() == null ? null : toJson(result.data());
        toolRecords.save(new ToolExecutionRecord(context.executionId(), context.stepNumber(), call.name(),
                call.argumentsJson(), output, result.status(), durationMs, result.errorMessage()));
        return result;
    }

    /** The model is an untrusted client: unknown tools are refused and arguments are parsed and validated first. */
    @SuppressWarnings("unchecked")
    private ToolResult invoke(AiTool<?> tool, ToolCall call, ToolExecutionContext context) {
        if (tool == null) {
            return ToolResult.denied("Tool '" + call.name() + "' is not available to you.");
        }
        ToolDefinition definition = tool.definition();
        if (definition.capability() != ToolCapability.READ) {
            return ToolResult.denied("Only read-only tools can run for now.");
        }

        Object input;
        try {
            String arguments = call.argumentsJson() == null || call.argumentsJson().isBlank() ? "{}" : call.argumentsJson();
            input = objectMapper.readValue(arguments, definition.inputType());
        } catch (JacksonException e) {
            return ToolResult.error("Arguments for " + definition.name() + " are not valid: " + e.getOriginalMessage());
        }
        Set<ConstraintViolation<Object>> violations = validator.validate(input);
        if (!violations.isEmpty()) {
            return ToolResult.error("Invalid arguments: " + violations.stream()
                    .map(v -> v.getPropertyPath() + " " + v.getMessage())
                    .sorted()
                    .collect(Collectors.joining(", ")));
        }

        try {
            return ((AiTool<Object>) tool).execute(context, input);
        } catch (BackendException e) {
            return ToolResult.error(e.getMessage());
        } catch (RuntimeException e) {
            log.warn("Tool {} failed in execution {}", definition.name(), context.executionId(), e);
            return ToolResult.error("The tool failed unexpectedly.");
        }
    }

    private String systemPrompt(AgentDefinition agent, AgentContext context) {
        String properties = context.properties().isEmpty()
                ? "The user does not manage any properties."
                : context.properties().entrySet().stream()
                        .map(entry -> "- " + entry.getValue().name() + " (propertyId: " + entry.getKey() + ")")
                        .collect(Collectors.joining("\n"));
        return agent.systemPrompt()
                .replace("{today}", LocalDate.now().toString())
                .replace("{properties}", properties);
    }

    private AgentResult finish(AgentExecution execution, ExecutionStatus status, String reply, String error,
                               int steps, TokenUsage usage, String model) {
        execution.setStatus(status);
        execution.setFinalResponse(reply);
        execution.setErrorMessage(error);
        execution.setSteps(steps);
        execution.setInputTokens(usage.inputTokens());
        execution.setOutputTokens(usage.outputTokens());
        execution.setModel(model);
        execution.setUpdatedAt(LocalDateTime.now());
        executions.save(execution);
        return new AgentResult(execution.getId(), status, reply, steps, usage);
    }

    private String toJson(Object value) {
        return objectMapper.writeValueAsString(value);
    }
}
