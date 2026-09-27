# Talking to the model

`llm/` is how the runtime reaches a language model. It is split in two so the rest of ai-service never
depends on Spring AI or on a particular provider:

- `llm/` holds plain Java contracts;
- `llm/adapter/` holds the only class that uses Spring AI. `ArchitectureTest` fails the build if
  Spring AI shows up anywhere else.

## The contracts (`llm/`)

| Type | What it is |
|---|---|
| `LlmGateway` | One method: `ModelResponse chat(ModelRequest request)`. |
| `ModelRequest` | The conversation so far, the tool definitions to offer, and the temperature. |
| `ModelMessage` | One turn: `SystemPrompt`, `UserText`, `AssistantTurn` (text plus any tool calls), or `ToolResults` (one `ToolCallResult` per call). |
| `ModelResponse` | The model's text, the tool calls it wants, token usage and the model name. `hasToolCalls()` says whether the loop continues. |
| `ToolCall` | `id`, `name` and `argumentsJson`. The arguments are untrusted until the runtime validates them. |
| `TokenUsage` | Input and output token counts, summed across steps with `plus`. |

## The adapter: `SpringAiLlmGateway`

Each `chat` call does the following:

1. **Gets the model.** It uses Spring AI's `ChatModel` bean. Spring AI creates it from
   `spring.ai.model.chat`, which is `google-genai` for Gemini. If no model is configured, the call
   throws, and the run ends `FAILED` with the friendly reply.
2. **Builds the options from the model's own defaults.** It starts from
   `chatModel.getDefaultOptions().mutate()`, so provider settings such as the model name carry over,
   then sets the temperature.
3. **Offers the tools as definitions only.** Each `ToolDefinition` becomes a small `ToolCallback`
   that has a name, a description and a JSON schema (from `JsonSchemaGenerator`, cached per input
   type). Its `call()` throws if anything tries to use it.
4. **Switches off Spring AI's own tool loop** with `internalToolExecutionEnabled(false)`. Spring AI
   returns the model's tool calls instead of running them, so `AgentRuntime` can check, run and record
   each one itself.
5. **Translates the messages** to Spring AI's `SystemMessage`, `UserMessage`, `AssistantMessage` and
   `ToolResponseMessage`.
6. **Translates the reply back.** It joins the text and collects tool calls from every generation
   (providers sometimes split one turn across several), then reads token usage and the model name.

### Why the runtime owns the loop

Spring AI can run tools by itself, but then the runtime couldn't:
- refuse a tool the user wasn't offered;
- validate arguments before running anything;
- record each call;
- stop at a step limit;
- later, pause for a human approval.

So Spring AI only carries messages; every decision stays in `AgentRuntime`.

## Retries

Configured under `spring.ai.retry` in `application.yml`:

```yaml
spring:
  ai:
    retry:
      max-attempts: 3
      backoff:
        initial-interval: 1s
        multiplier: 2
        max-interval: 4s
```

Spring AI's defaults (10 attempts, 5× backoff) held a request for about 45 seconds when Gemini
returned 429, close to the apps' 60-second timeout. Three tries follows the design doc's V1 guardrail.

## Gemini settings

| Variable | Default | Meaning |
|---|---|---|
| `SPRING_AI_MODEL_CHAT` | `none` | Set to `google-genai` to create the Gemini model. With `none`, every run fails. |
| `GEMINI_API_KEY` | (empty) | API key. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Model name. |
| `GEMINI_TEMPERATURE` | `0.2` | Default temperature; the agent's own value is applied on top per request. |

**Free-tier quota:** on 2026-09-26 the free tier for `gemini-2.5-flash` allowed 20 requests per day.
Each question uses 1 to 3 model calls, so a free key serves only a handful of questions a day. Real
use needs a paid key or a different model.

## Switching provider

Nothing outside `llm/adapter` changes. For example, to use Claude:

1. Add the starter to `pom.xml`: `spring-ai-starter-model-anthropic` (or
   `spring-ai-starter-model-openai` for OpenAI).
2. Set `SPRING_AI_MODEL_CHAT=anthropic` and the provider's key and model properties (see the Spring AI
   docs for that starter).
3. Run a few questions and check the audit rows.

The adapter needs a model whose options builder supports tool calling
(`ToolCallingChatOptions.Builder`). If it doesn't and tools are offered, the adapter throws rather
than silently dropping the tools.
