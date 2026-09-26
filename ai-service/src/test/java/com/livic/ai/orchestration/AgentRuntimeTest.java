package com.livic.ai.orchestration;

import com.livic.ai.agent.AgentContext;
import com.livic.ai.agent.AgentContext.PropertyAccess;
import com.livic.ai.agent.AgentDefinition;
import com.livic.ai.agent.AgentResult;
import com.livic.ai.agent.ExecutionStatus;
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
import jakarta.validation.Validation;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Supplier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AgentRuntimeTest {

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID PROPERTY_ID = UUID.randomUUID();

    private final ScriptedLlm llm = new ScriptedLlm();
    private final EchoTool echo = new EchoTool("echo", ToolCapability.READ);
    private final EchoTool writer = new EchoTool("write_something", ToolCapability.WRITE);
    private final List<AgentExecution> savedExecutions = new ArrayList<>();
    private final List<ToolExecutionRecord> savedRecords = new ArrayList<>();
    private final AgentDefinition agent = new AgentDefinition(
            "test-agent", "Today {today}. Properties:\n{properties}", List.of("echo", "write_something"), 3, 0.2);

    private AgentRuntime runtime;

    @BeforeEach
    void setUp() {
        AgentExecutionRepository executions = mock(AgentExecutionRepository.class);
        when(executions.save(any())).thenAnswer(invocation -> {
            AgentExecution execution = invocation.getArgument(0);
            savedExecutions.add(execution);
            return execution;
        });
        ToolExecutionRecordRepository records = mock(ToolExecutionRecordRepository.class);
        when(records.save(any())).thenAnswer(invocation -> {
            ToolExecutionRecord record = invocation.getArgument(0);
            savedRecords.add(record);
            return record;
        });
        runtime = new AgentRuntime(
                llm,
                new ToolRegistry(List.of(echo, writer)),
                executions,
                records,
                JsonMapper.builder().disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build(),
                Validation.buildDefaultValidatorFactory().getValidator());
    }

    @Test
    void runsARequestedToolAndReturnsTheModelsAnswer() {
        llm.respond(() -> toolCalls(new ToolCall("c1", "echo", "{\"text\":\"hi\"}")));
        llm.respond(() -> answer("All done."));

        AgentResult result = runtime.run(agent, landlordContext(), "Say hi");

        assertThat(result.status()).isEqualTo(ExecutionStatus.COMPLETED);
        assertThat(result.responseText()).isEqualTo("All done.");
        assertThat(result.steps()).isEqualTo(2);
        assertThat(result.usage()).isEqualTo(new TokenUsage(20, 10));

        assertThat(echo.inputs).extracting(EchoTool.Input::text).containsExactly("hi");
        ToolExecutionContext toolContext = echo.contexts.getFirst();
        assertThat(toolContext.userId()).isEqualTo(USER_ID);
        assertThat(toolContext.userToken()).isEqualTo("jwt");
        assertThat(toolContext.executionId()).isEqualTo(result.executionId());
        assertThat(toolContext.stepNumber()).isEqualTo(1);

        assertThat(savedRecords).singleElement().satisfies(record -> {
            assertThat(record.getToolName()).isEqualTo("echo");
            assertThat(record.getStatus()).isEqualTo(ToolResult.Status.SUCCESS);
            assertThat(record.getInputPayload()).isEqualTo("{\"text\":\"hi\"}");
            assertThat(record.getOutputPayload()).contains("hi");
        });
        assertThat(lastToolResultSentToModel()).contains("\"status\":\"SUCCESS\"");

        AgentExecution execution = savedExecutions.getLast();
        assertThat(execution.getStatus()).isEqualTo(ExecutionStatus.COMPLETED);
        assertThat(execution.getFinalResponse()).isEqualTo("All done.");
        assertThat(execution.getInputTokens()).isEqualTo(20);
        assertThat(execution.getModel()).isEqualTo("test-model");
    }

    @Test
    void fillsTheSystemPromptWithTheCallersProperties() {
        llm.respond(() -> answer("Hello."));

        runtime.run(agent, landlordContext(), "Hi");

        ModelMessage system = llm.requests.getFirst().messages().getFirst();
        assertThat(system).isInstanceOfSatisfying(ModelMessage.SystemPrompt.class, prompt ->
                assertThat(prompt.text()).contains("- Sunrise Apartments (propertyId: " + PROPERTY_ID + ")")
                        .doesNotContain("{today}"));
    }

    @Test
    void refusesAToolTheCallerWasNotOffered() {
        llm.respond(() -> toolCalls(new ToolCall("c1", "echo", "{\"text\":\"hi\"}")));
        llm.respond(() -> answer("I can't do that."));
        var residentContext = new AgentContext(USER_ID, "jwt", "req-1", Map.of());

        AgentResult result = runtime.run(agent, residentContext, "Say hi");

        assertThat(llm.requests.getFirst().tools()).isEmpty();
        assertThat(echo.inputs).isEmpty();
        assertThat(savedRecords).singleElement()
                .extracting(ToolExecutionRecord::getStatus).isEqualTo(ToolResult.Status.DENIED);
        assertThat(lastToolResultSentToModel()).contains("DENIED");
        assertThat(result.status()).isEqualTo(ExecutionStatus.COMPLETED);
    }

    @Test
    void doesNotRunWriteToolsYet() {
        llm.respond(() -> toolCalls(new ToolCall("c1", "write_something", "{\"text\":\"x\"}")));
        llm.respond(() -> answer("Sorry."));

        runtime.run(agent, landlordContext(), "Change something");

        assertThat(writer.inputs).isEmpty();
        assertThat(savedRecords).singleElement()
                .extracting(ToolExecutionRecord::getStatus).isEqualTo(ToolResult.Status.DENIED);
    }

    @Test
    void sendsInvalidArgumentsBackToTheModelWithoutRunningTheTool() {
        llm.respond(() -> toolCalls(new ToolCall("c1", "echo", "{\"text\":\"\"}")));
        llm.respond(() -> answer("Let me fix that."));

        runtime.run(agent, landlordContext(), "Say nothing");

        assertThat(echo.inputs).isEmpty();
        assertThat(savedRecords).singleElement().satisfies(record -> {
            assertThat(record.getStatus()).isEqualTo(ToolResult.Status.ERROR);
            assertThat(record.getErrorMessage()).startsWith("Invalid arguments: text");
        });
    }

    @Test
    void failsWhenTheModelKeepsCallingToolsPastTheStepLimit() {
        for (int i = 0; i < agent.maxSteps(); i++) {
            llm.respond(() -> toolCalls(new ToolCall("c", "echo", "{\"text\":\"again\"}")));
        }

        AgentResult result = runtime.run(agent, landlordContext(), "Loop");

        assertThat(result.status()).isEqualTo(ExecutionStatus.FAILED);
        assertThat(result.steps()).isEqualTo(agent.maxSteps());
        assertThat(result.responseText()).isEqualTo(AgentRuntime.FAILURE_REPLY);
        assertThat(savedExecutions.getLast().getErrorMessage()).isEqualTo("MAX_STEPS_EXCEEDED");
        assertThat(llm.requests).hasSize(agent.maxSteps());
    }

    @Test
    void failsGracefullyWhenTheModelErrors() {
        llm.respond(() -> {
            throw new IllegalStateException("provider down");
        });

        AgentResult result = runtime.run(agent, landlordContext(), "Hi");

        assertThat(result.status()).isEqualTo(ExecutionStatus.FAILED);
        assertThat(result.responseText()).isEqualTo(AgentRuntime.FAILURE_REPLY);
        assertThat(savedExecutions.getLast().getErrorMessage()).isEqualTo("provider down");
    }

    private static AgentContext landlordContext() {
        return new AgentContext(USER_ID, "jwt", "req-1",
                Map.of(PROPERTY_ID, new PropertyAccess("Sunrise Apartments", Set.of("ISSUE_VIEW"))));
    }

    private static ModelResponse toolCalls(ToolCall... calls) {
        return new ModelResponse(null, List.of(calls), new TokenUsage(10, 5), "test-model");
    }

    private static ModelResponse answer(String text) {
        return new ModelResponse(text, List.of(), new TokenUsage(10, 5), "test-model");
    }

    private String lastToolResultSentToModel() {
        return llm.requests.getLast().messages().stream()
                .filter(ModelMessage.ToolResults.class::isInstance)
                .map(ModelMessage.ToolResults.class::cast)
                .reduce((first, second) -> second)
                .orElseThrow()
                .results().getFirst().content();
    }

    private static final class ScriptedLlm implements LlmGateway {

        private final Deque<Supplier<ModelResponse>> script = new ArrayDeque<>();
        private final List<ModelRequest> requests = new ArrayList<>();

        void respond(Supplier<ModelResponse> response) {
            script.add(response);
        }

        @Override
        public ModelResponse chat(ModelRequest request) {
            requests.add(request);
            return script.removeFirst().get();
        }
    }

    private static final class EchoTool implements AiTool<EchoTool.Input> {

        record Input(@NotBlank String text) {
        }

        private final ToolDefinition definition;
        private final List<Input> inputs = new ArrayList<>();
        private final List<ToolExecutionContext> contexts = new ArrayList<>();

        EchoTool(String name, ToolCapability capability) {
            this.definition = new ToolDefinition(name, "Echoes text", Input.class, capability, "ISSUE_VIEW");
        }

        @Override
        public ToolDefinition definition() {
            return definition;
        }

        @Override
        public ToolResult execute(ToolExecutionContext context, Input input) {
            contexts.add(context);
            inputs.add(input);
            return ToolResult.success("Echoed.", Map.of("text", input.text()));
        }
    }
}
