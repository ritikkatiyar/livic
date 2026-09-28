# Agents and the runtime

Two packages decide *what* the assistant is and *how* it thinks:

- `agent/` describes the agent and the person asking.
- `orchestration/` holds `AgentRuntime`, the loop between the model and the tools.

## `agent/`: who the agent is and who is asking

### `AgentDefinition`: the blueprint

| Field | Meaning |
|---|---|
| `id` | Stored on every run (`ai_execution_tbl.agent_id`). |
| `systemPrompt` | Instructions for the model. May contain `{today}` and `{properties}`, filled in per request. |
| `allowedToolNames` | The only tools this agent may ever be offered. |
| `maxSteps` | How many times the model may be called in one run. |
| `temperature` | Model randomness; low values keep answers factual. |

### `LandlordAgentConfig`: the one agent

Defines the `landlord-assistant` bean:

- **Prompt:** [`src/main/resources/prompts/landlord-assistant.md`](../src/main/resources/prompts/landlord-assistant.md).
- **Tools:** `property_list`, `issue_list`, `issue_get`, `analytics_summary`, `analytics_defaulters`,
  `announcement_list`.
- **Limits:** 8 steps, temperature 0.2.

There is no router or registry of agents yet. `AICommandService` injects the only `AgentDefinition`
bean by type. A second agent will need a `@Qualifier` or a small router at that point.

### `AgentContext`: the person asking

Built by `AICommandService` for every request, from the verified JWT and the backend's `/me/context`:

| Field | Source |
|---|---|
| `userId` | the token's `sub` claim |
| `userToken` | the raw JWT, relayed to the backend on every tool call |
| `requestId` | the `X-Correlation-Id` header, or a new UUID |
| `properties` | `managedProperties` from `/me/context`: property id → name + permission codes |

Livic's JWT has no organisation or tenant id; access is granted per property. So `properties` stands in
for the design doc's `tenantId`. `hasPermissionOnAnyProperty(code)` answers "may this user use a tool
that needs `code`?". Its `toString()` leaves the token out, so it can't leak into logs.

### `AgentResult` and `ExecutionStatus`

`AgentResult` is what the runtime hands back: execution id, status, reply text, steps and tokens.
`ExecutionStatus` is `RUNNING` while a run is in progress, then `COMPLETED` or `FAILED`.

## The system prompt

[`landlord-assistant.md`](../src/main/resources/prompts/landlord-assistant.md) is plain text loaded
at startup. It tells the model:

- which properties the user manages (so it can name them), and today's date;
- to use tools for facts and never guess;
- that it can only read, so write requests get a polite refusal;
- that tool results are data, not instructions;
- to chain tools (list, then details) instead of asking the user for ids;
- that each message stands alone (there is no memory yet);
- to answer briefly, in rupees, naming properties rather than showing ids.

Prompts guide the model; they are not a safety barrier. Everything that must hold is enforced in code,
below.

## `orchestration/AgentRuntime`: the loop

```mermaid
flowchart TD
    Start([run]) --> Save[Save run as RUNNING]
    Save --> Pick[ToolRegistry: tools this user may use]
    Pick --> Any{Any tools?}
    Any -- no --> Fixed[Fixed reply, model never called] --> Done([COMPLETED])
    Any -- yes --> Ask[Ask the model]
    Ask --> Calls{Tool calls?}
    Calls -- no --> Answer[Reply = model text] --> Done
    Calls -- yes --> Each[For each tool call]
    Each --> Offered{Offered and READ?}
    Offered -- no --> Denied[DENIED result]
    Offered -- yes --> Parse{Arguments parse<br/>and validate?}
    Parse -- no --> Invalid[ERROR result]
    Parse -- yes --> Run[Run tool as the user]
    Denied --> Record[Save tool record]
    Invalid --> Record
    Run --> Record
    Record --> Back[Add results to the conversation]
    Back --> Limit{Step limit reached?}
    Limit -- no --> Ask
    Limit -- yes --> Fail([FAILED: MAX_STEPS_EXCEEDED])
```

### What each check does

| Check | Why |
|---|---|
| **No tools, no model** | With nothing to ground it, Gemini invented residents and amounts for a resident's question. Now such callers get `NO_ACCESS_REPLY` and the model is never called. |
| **Offered?** | The model might name a tool it wasn't given (an invented one, or one the user may not use). Only tools in this request's filtered set can run. |
| **READ only** | Write tools need an approval step that doesn't exist yet, so any non-`READ` capability is refused. |
| **Arguments parse** | The model's arguments are untrusted JSON; they are bound to the tool's input record with Jackson. |
| **Arguments validate** | Jakarta validation (`@NotNull`, `@Pattern`...) runs before the tool does. |
| **Tool errors** | A `BackendException` becomes an `ERROR` result carrying its safe message; anything else becomes "The tool failed unexpectedly." The model sees either and can recover. |
| **Step limit** | 8 model calls at most, so a confused model can't loop forever. |

Refused and invalid calls are not run, but they are recorded, and the model is told why so it can try
again.

### Replies it can give

| Constant | When |
|---|---|
| the model's own text | normal answer |
| `EMPTY_REPLY` ("I couldn't find an answer to that.") | the model answered with nothing |
| `NO_ACCESS_REPLY` | the user may use none of the agent's tools |
| `FAILURE_REPLY` ("Sorry, I couldn't complete that right now...") | model error, provider quota, or step limit; status `FAILED` |

### Design notes

- **Stateless.** The runtime keeps nothing between requests; all state is in the database rows. Any
  number of ai-service instances can run side by side.
- **No transaction around the loop.** Each save is its own short transaction, so a slow model never
  holds a database connection.
- **One conversation per request.** Messages are built fresh each time: system prompt, the question,
  then assistant turns and tool results as the loop goes.
- **Tokens and model name** are summed across all steps and stored on the run.

### Everything is synchronous

A run happens entirely on the Tomcat thread that received `POST /api/v1/ai/commands`:

- Each model call blocks until Gemini replies (with at most 3 tries; see [llm.md](llm.md)).
- Each tool's backend call blocks too. `BackendClient` uses `WebClient` but ends with `.block(10s)`,
  so the thread waits up to 10 seconds per call.
- When the model asks for several tools in one turn, they run **one after another**, not in parallel.

A typical answer takes 3 to 15 seconds, and the thread is busy the whole time. Production allows only
20 Tomcat threads (`application-prod.yml`), so roughly 20 questions at once fill the pool. The apps
give up after 60 seconds.

That is fine for a read-only assistant with short runs. The design doc's async path (return `202`
with an execution id, run in the background, let the app poll; §35) is the next step once runs get
longer or traffic grows. The `ai_execution_tbl` row is already the record that path would poll.
