# Livic AI Architecture Specification (Phase 1: Design & Core Abstractions)

## 1. Executive Summary & Architectural Principles

Livic is a property and resident management platform consisting of a modular Spring Boot backend, web/mobile frontends, and a standalone `ai-service` application (Java 21, Spring AI). 

The AI service operates as an **intelligent orchestration & runtime gateway**. It bridges natural language intent from residents and property managers to backend business operations without exposing internal entities, raw databases, or untracked state to Large Language Models (LLMs).

### Foundational Principles

1. **Role Separation**:
   * **LLM**: Reasoning, decision making, semantic parsing, and natural language synthesis.
   * **Java Tools / Services**: Business capabilities, input validation, and business logic execution.
   * **Core Backend (`backend`)**: Sole source of truth for business data, tenancy rules, and permissions.
   * **AI Service (`ai-service`)**: Orchestration, conversational memory, state machine, and runtime layer.
2. **Strict Data & Infrastructure Isolation**:
   * The LLM must **NEVER** directly access databases, JPA repositories, entity tables, or internal private services.
   * All data operations go through authenticated tool implementations communicating via REST/HTTP APIs with the backend.
3. **Domain Independence**:
   * Core domain concepts (`Agent`, `AiTool`, `AgentRuntime`, `AgentExecution`) belong to Livic's domain model and must not depend directly on `org.springframework.ai.*`.
   * Spring AI acts as an infrastructure adapter, allowing LLM providers (Google Gemini, OpenAI, Anthropic, local models) to be swapped without modifying runtime orchestration.
4. **Tenant Isolation by Construction**:
   * Tenant identity (`tenantId`) and user identity (`userId`) are propagated explicitly through strongly-typed contexts (`AgentContext`, `ToolExecutionContext`).
   * The LLM is never trusted to supply or override tenant boundaries.

```
Agent
  ↓
Agent Runtime
  ↓
LLM (Reasoning)
  ↓
Tool Decision
  ↓
Tool Registry
  ↓
Authorization & Policy Enforcement
  ↓
Tool Implementation (AiTool)
  ↓
Backend API (HTTP / Tenant Token Relayed)
  ↓
Tool Result
  ↓
Agent Runtime
  ↓
LLM (Synthesis)
  ↓
Final Response
```

---

## 2. Conceptual Architecture & Package Structure

```
com.livic.ai
├── api/                           # Inbound transport layer (REST / SSE / Webhook)
├── agent/                         # Core agent contracts and blueprints
├── orchestration/                 # Reasoning loops, runtime engine & routing
├── tools/                         # Domain tool contracts, registry & implementations
├── memory/                        # Conversation history & chat memory persistence
├── knowledge/                     # RAG, document grounding & vector indexing
├── llm/                           # Decoupled model client contracts & adapters
├── security/                      # Tenant isolation & tool authorization gatekeepers
├── persistence/                   # Execution state & tool audit entities
├── events/                        # Internal domain events (lifecycle, approvals)
├── mcp/                           # Model Context Protocol bridge & adapters
└── observability/                 # Metrics, token tracking & OpenTelemetry tracing
```

---

## 3. Analysis of the 14 Core Abstractions

### 1. `AgentDefinition`
* **Why does it exist?** Acts as the static configuration blueprint for an agent archetype (e.g., `MaintenanceAgent`, `BillingAgent`, `LeasingAgent`).
* **Responsibility owned:** Defines agent metadata, role requirements, default model configuration (temperature, model name), system prompt template, and allowed tool names.
* **Responsibility NOT placed here:** Runtime execution logic, session memory, tenant context, or dynamic state.
* **Information/State:** `agentId`, `name`, `description`, `systemPromptTemplate`, `defaultModelId`, `temperature`, `requiredRoles`, `allowedToolNames`, `maxSteps`, `isHumanApprovalRequired`.
* **Creator:** Seeded at startup by configuration classes (Spring `@Configuration`, YAML properties, or database catalogue).
* **Consumer:** `AgentRegistry`, `AgentRouter`, `AgentRuntime`.
* **Dependencies:** None (pure domain definition value object).
* **Transient vs Persisted:** Configuration metadata (in-memory or read-only configuration table).
* **Participation in a request:** Looked up by `AgentRouter` or `AgentRuntime` to assemble the system prompt, tool constraints, and operational bounds for the prompt.

### 2. `Agent`
* **Why does it exist?** Active instance or handle representing an agent archetype bound to runtime policies.
* **Responsibility owned:** Exposing high-level execution contracts (`execute(AgentContext): AgentResult`) while binding an `AgentDefinition` to specific orchestration behaviors.
* **Responsibility NOT placed here:** LLM provider calling details, low-level HTTP transport, database transactions.
* **Information/State:** Reference to `AgentDefinition`, reference to its scoped `ToolRegistry` slice.
* **Creator:** Spring factory / `AgentRegistry` during initialization.
* **Consumer:** `AgentRouter`, `AgentRuntime`.
* **Dependencies:** `AgentDefinition`, `ToolDefinition`.
* **Transient vs Persisted:** Transient singleton bean/service managed by the Spring container.
* **Participation in a request:** Acts as the logical entry target selected by `AgentRouter`; delegates execution to `AgentRuntime`.

### 3. `AgentContext`
* **Why does it exist?** Contextual envelope for an incoming agent invocation, capturing who is asking, for which tenant/property, under what security token, and with what correlation IDs.
* **Responsibility owned:** Context propagation, tenant isolation attributes, caller identity, and correlation metadata across threads and async boundaries.
* **Responsibility NOT placed here:** LLM conversation history, intermediate tool results, or model prompts.
* **Information/State:** `tenantId`, `userId`, `userRoles`, `userToken`, `conversationId`, `requestId`, `channel` (MOBILE/WEB/EVENT), `metadata` (e.g., `clientIp`, `locale`).
* **Creator:** Created at the API/Controller layer from HTTP security context, JWT claims, and request headers.
* **Consumer:** `AgentRuntime`, `PolicyEnforcer`, `ToolExecutionContext`, audit logging.
* **Dependencies:** Identity/tenant value types.
* **Transient vs Persisted:** Transient (per-request memory object; fields like `conversationId` and `tenantId` are stamped into persisted records).
* **Participation in a request:** Flowed down through all calls. Used by `ToolRegistry` to enforce security filters and by tools to make authenticated downstream backend calls.

### 4. `AgentResult`
* **Why does it exist?** Standardized domain response returned to the caller, encapsulating final text, status, actions taken, token usage, and pending human approvals.
* **Responsibility owned:** Communicating execution outcomes in a uniform format regardless of whether the agent ran 1 step or 5 steps.
* **Responsibility NOT placed here:** Raw LLM provider response objects or Spring AI-specific entities.
* **Information/State:** `executionId`, `status` (`SUCCESS`, `FAILED`, `REQUIRES_APPROVAL`), `responseText`, `stepsExecuted`, `toolExecutionsSummary`, `tokenUsage`, `errors`.
* **Creator:** `AgentRuntime` at the conclusion of an execution cycle.
* **Consumer:** `AIController`, event publishers, client callers.
* **Dependencies:** Value object referencing summary records.
* **Transient vs Persisted:** Transient response payload (though its fields are mirrored in the persisted `AgentExecution`).
* **Participation in a request:** Final outcome produced by `AgentRuntime` and mapped to HTTP `ApiResponse<AICommandResponse>`.

### 5. `AgentRegistry`
* **Why does it exist?** Central catalog of all registered agents in the system.
* **Responsibility owned:** Storing, discovering, and retrieving `Agent` and `AgentDefinition` instances by ID, capability, or role.
* **Responsibility NOT placed here:** Routing decisions, model execution, tool execution.
* **Information/State:** Map of `agentId -> Agent`, indexing by role/capability.
* **Creator:** Spring container during application bootstrap.
* **Consumer:** `AgentRouter`, administrative endpoints.
* **Dependencies:** `Agent`, `AgentDefinition`.
* **Transient vs Persisted:** In-memory registry (singleton).
* **Participation in a request:** Queried by `AgentRouter` to locate candidate agents matching the user's intent or requested agent ID.

### 6. `AgentRouter`
* **Why does it exist?** Determines which agent should handle an incoming prompt if the user does not explicitly specify an agent (or validates whether the specified agent is appropriate).
* **Responsibility owned:** Semantic classification or rule-based routing of user intent to a specific `Agent`.
* **Responsibility NOT placed here:** Executing the agent loop or invoking tools.
* **Information/State:** Routing strategies (rule-based keyword matchers, embedding router, or small LLM intent classifier).
* **Creator:** Spring container singleton.
* **Consumer:** `AIController` or Event Listeners.
* **Dependencies:** `AgentRegistry`, `ModelClient` (if using semantic classification).
* **Transient vs Persisted:** In-memory service (singleton).
* **Participation in a request:** The first stop after the API controller: inspects `AgentContext` and user prompt, returns the matched `Agent`.

### 7. `AgentRuntime`
* **Why does it exist?** The core orchestration engine that runs the ReAct / reasoning loop (Prompt -> LLM -> Tool Call -> Tool Execution -> Observation -> LLM -> Response).
* **Responsibility owned:** Driving the multi-turn loop, tracking max iteration safety limits, coordinating model adapters, invoking tool pipelines, and recording execution history.
* **Responsibility NOT placed here:** Tool business logic, direct HTTP endpoint handling, hardcoded provider client setups.
* **Information/State:** Stateless engine; dependencies on `ModelClient`, `ToolRegistry`, `PolicyEnforcer`, `ExecutionRepository`.
* **Creator:** Spring container singleton.
* **Consumer:** `Agent` implementations, `AIController`, async event listeners.
* **Dependencies:** `ModelClient`, `ToolRegistry`, `PolicyEnforcer`, `ExecutionRepository`.
* **Transient vs Persisted:** In-memory singleton service.
* **Participation in a request:** Controls the full execution lifecycle from the moment an agent is triggered until final completion or suspension.

### 8. `AiTool`
* **Why does it exist?** Domain contract for any capability that the AI can execute. Shields business logic from Spring AI `@Tool` or LLM provider annotations.
* **Responsibility owned:** Executing a defined capability against the backend or domain service given a validated input and execution context.
* **Responsibility NOT placed here:** Deciding *when* to run, parameter parsing from raw JSON (handled by tool wrapper/marshaler), role authorization checks.
* **Information/State:** Defines `ToolDefinition getDefinition()` and `ToolResult execute(ToolExecutionContext context, T input)`.
* **Creator:** Spring bean component (e.g., `PropertyTool`, `MaintenanceIssuesTool`, `SendPaymentReminderTool`).
* **Consumer:** `AgentRuntime` via `ToolRegistry`.
* **Dependencies:** Backend integration clients (`BackendAdminClient`, `WebClient`), domain DTOs.
* **Transient vs Persisted:** Singleton Spring bean.
* **Participation in a request:** Dispatched by `AgentRuntime` when the LLM requests a matching tool invocation.

### 9. `ToolDefinition`
* **Why does it exist?** Metadata describing a tool to the LLM (name, description, schema of arguments, whether it is read-only or destructive, required authorization scopes).
* **Responsibility owned:** Schema description, capability categorization, safety flags.
* **Responsibility NOT placed here:** Tool execution logic or internal connection parameters.
* **Information/State:** `name`, `description`, `inputSchemaJson`, `outputSchemaJson`, `isDestructive`, `requiresHumanApproval`, `requiredPermissions`.
* **Creator:** Provided by `AiTool` or generated via reflection/schema generator at startup.
* **Consumer:** `ToolRegistry`, `AgentRuntime`, `ModelClient` (converted to provider tool specifications).
* **Dependencies:** Schema value types.
* **Transient vs Persisted:** In-memory metadata.
* **Participation in a request:** Transformed into LLM function/tool schemas and sent in the chat completion request.

### 10. `ToolRegistry`
* **Why does it exist?** Central registry of all available `AiTool` instances in the system with security-aware filtering.
* **Responsibility owned:** Registration, lookup, and role/tenant-filtered discovery of tools (`getAvailableToolsFor(AgentContext, AgentDefinition)`).
* **Responsibility NOT placed here:** Executing the tools or calling the model.
* **Information/State:** Map of `toolName -> AiTool`.
* **Creator:** Spring container singleton.
* **Consumer:** `AgentRuntime`, `PolicyEnforcer`.
* **Dependencies:** List of all `AiTool` beans.
* **Transient vs Persisted:** In-memory singleton.
* **Participation in a request:** `AgentRuntime` asks `ToolRegistry` for the subset of tools the current user/agent is permitted to call.

### 11. `ToolExecutionContext`
* **Why does it exist?** Scoped, contextual envelope passed directly into `AiTool.execute()`. Contains everything the tool needs without relying on static `ThreadLocal` hacks.
* **Responsibility owned:** Supplying security tokens, tenant context, user identity, correlation IDs, and execution step IDs to the executing tool.
* **Responsibility NOT placed here:** Tool arguments or LLM context.
* **Information/State:** `tenantId`, `userId`, `userToken`, `executionId`, `stepNumber`, `correlationId`.
* **Creator:** Instantiated by `AgentRuntime` right before invoking `AiTool.execute()`.
* **Consumer:** `AiTool` implementations when calling `BackendAdminClient`.
* **Dependencies:** Derived from `AgentContext` and current `AgentExecution` step.
* **Transient vs Persisted:** Transient per-tool-call object.
* **Participation in a request:** Passed as an argument to `AiTool.execute(context, input)` so the tool relays `userToken` and `tenantId` safely to the backend API.

### 12. `ToolResult`
* **Why does it exist?** Structured domain outcome of a tool execution.
* **Responsibility owned:** Encapsulating success/failure, tool output payload, user-facing summary, error messages, and raw backend response references.
* **Responsibility NOT placed here:** Converting output to prompt strings (handled by runtime/prompt serializer).
* **Information/State:** `toolName`, `status` (`SUCCESS`, `ERROR`, `PERMISSION_DENIED`, `APPROVAL_REQUIRED`), `data` (Object/Map), `summaryText`, `errorMessage`, `executionDurationMs`.
* **Creator:** Created by `AiTool` upon completion or caught by `AgentRuntime` on exception.
* **Consumer:** `AgentRuntime` (to feed back to LLM) and `ToolExecutionRecord` (for audit storage).
* **Dependencies:** None.
* **Transient vs Persisted:** Transient payload, serialized into `ToolExecutionRecord` for persistence.
* **Participation in a request:** Returned by the tool, captured in execution logs, and appended as a `ToolResponseMessage` in the conversation thread for the LLM.

### 13. `AgentExecution`
* **Why does it exist?** Entity tracking the full execution lifecycle and state of a multi-step agent run.
* **Responsibility owned:** Storing state, status (`RUNNING`, `WAITING_FOR_APPROVAL`, `COMPLETED`, `FAILED`), current step counter, input prompt, final response, and tenant ID.
* **Responsibility NOT placed here:** Tool logic or direct LLM calling.
* **Information/State:** `executionId`, `conversationId`, `agentId`, `tenantId`, `userId`, `prompt`, `status`, `currentStep`, `maxSteps`, `finalResponse`, `errorMessage`, `createdAt`, `updatedAt`.
* **Creator:** Instantiated and saved by `AgentRuntime` when execution begins.
* **Consumer:** `AgentRuntime`, retry schedulers, approval services, UI status pollers.
* **Dependencies:** Persisted domain entity.
* **Transient vs Persisted:** **Persisted** in the database (`ai_execution_tbl`).
* **Participation in a request:** Created at start, updated after every step/tool execution, finalized at end. Serves as the checkpoint for resuming paused/failed workflows.

### 14. `ToolExecutionRecord`
* **Why does it exist?** Immutable audit and step record for every tool called during an `AgentExecution`.
* **Responsibility owned:** Auditing the exact arguments sent to a tool, the result received, execution timing, and errors.
* **Responsibility NOT placed here:** Orchestration decisions or token management.
* **Information/State:** `recordId`, `executionId`, `stepNumber`, `toolName`, `inputPayloadJson`, `outputPayloadJson`, `status`, `durationMs`, `errorMessage`, `createdAt`.
* **Creator:** Created and saved by `AgentRuntime` immediately after a tool finishes.
* **Consumer:** Audit logs, admin dashboards, debugging tools, replay/resume engines.
* **Dependencies:** Linked via foreign key to `AgentExecution`.
* **Transient vs Persisted:** **Persisted** in the database (`ai_tool_execution_record_tbl`).
* **Participation in a request:** Written at every iteration of the agent loop when a tool call is resolved.

---

## 4. Class & Component Relationships

```
                                +-------------------+
                                |  AgentDefinition  |
                                +-------------------+
                                          | 1
                                          | defines
                                          v 1
+------------------+  1       * +-------------------+
|   AgentRouter    |----------->|       Agent       |
+------------------+  routes to +-------------------+
         |                                |
         | dispatches                     | delegates
         v                                v
+------------------+ 1        1 +-------------------+
|   AgentContext   |----------->|   AgentRuntime    |
+------------------+  scopes    +-------------------+
                                          |
          +-------------------------------+-------------------------------+
          | drives loop                   | checks                        | runs
          v                               v                               v
+--------------------+          +--------------------+          +--------------------+
|   AgentExecution   |          |   PolicyEnforcer   |          |    ModelClient     |
+--------------------+          +--------------------+          | (Spring AI Adapter)|
          | 1                             |                     +--------------------+
          | has many                      | authorizes
          v *                             v
+--------------------+          +--------------------+ 1      * +--------------------+
|ToolExecutionRecord |          |    ToolRegistry    |--------->|       AiTool       |
+--------------------+          +--------------------+ contains +--------------------+
          ^                                                               | provides
          | recorded from                                                 v
+--------------------+          creates                passes   +--------------------+
|     ToolResult     |<-----------------------------------------|   ToolDefinition   |
+--------------------+   (ToolExecutionRecord, ToolResult)      +--------------------+
          ^                                                               |
          | executes with                                                 |
          +---------------------------------------------------------------+
                                          |
                                +--------------------+
                                |ToolExecutionContext|
                                +--------------------+
```

---

## 5. Execution Lifecycles

### Single-Step Lifecycle: Read Operation
**Prompt:** *"Show me the maintenance issues for my property."*

```
User (HTTP Client)
  │
  │  POST /api/v1/ai/commands {"message": "Show me the maintenance issues for my property."}
  ▼
AIController (com.livic.ai.api)
  │  1. Validates JWT, extracts tenantId, userId, userRoles.
  │  2. Assembles AgentContext(tenantId="t-100", userId="u-200", roles=["LANDLORD"]).
  ▼
AgentRouter (com.livic.ai.orchestration)
  │  3. Evaluates prompt intent -> identifies MaintenanceAgent.
  │  4. Fetches MaintenanceAgent from AgentRegistry.
  ▼
AgentRuntime (com.livic.ai.agent)
  │  5. Creates persisted AgentExecution(status=RUNNING, prompt="...").
  │  6. Fetches allowed tools: ToolRegistry.getAvailableTools(agentDef, agentContext)
  │     -> Filtered to [GetMaintenanceIssuesTool] (user has 'MAINTENANCE_READ').
  │  7. Converts ToolDefinition to LLM schema.
  │  8. Builds conversation prompt (System Prompt + Context + User Message).
  ▼
ModelClient (Spring AI Adapter -> Gemini/OpenAI)
  │  9. Sends prompt & tool definitions to LLM.
  │  10. LLM reasons: "I need to call get_maintenance_issues(propertyId=null)".
  │  11. Returns tool_call: name="get_maintenance_issues", arguments={}.
  ▼
AgentRuntime
  │  12. Intercepts tool call.
  │  13. PolicyEnforcer.authorizeToolCall(context, "get_maintenance_issues") -> OK.
  │  14. Assembles ToolExecutionContext(tenantId="t-100", userId="u-200", token="jwt...").
  ▼
AiTool: GetMaintenanceIssuesTool (com.livic.ai.tools)
  │  15. Invokes BackendAdminClient.getMaintenanceIssues(context.tenantId, context.userId).
  │  16. Backend returns 3 open tickets: [Ticket#101, Ticket#102, Ticket#103].
  │  17. Returns ToolResult.success(data=[...], count=3).
  ▼
AgentRuntime
  │  18. Saves ToolExecutionRecord(step=1, tool="get_maintenance_issues", status=SUCCESS).
  │  19. Appends ToolResult to LLM conversation buffer.
  ▼
ModelClient (Spring AI Adapter -> Gemini/OpenAI)
  │  20. Sends updated history back to LLM.
  │  21. LLM synthesizes natural language summary:
  │      "You have 3 open maintenance issues: 1. Water leak in Unit 4B..."
  ▼
AgentRuntime
  │  22. Detects finish_reason = STOP (no further tools requested).
  │  23. Updates AgentExecution(status=COMPLETED, finalResponse="...").
  │  24. Returns AgentResult(status=SUCCESS, responseText="...").
  ▼
AIController -> Returns 200 OK with ApiResponse<AICommandResponse>.
```

---

### Multi-Step Lifecycle: Read + Destructive Write with State Resumption
**Prompt:** *"Show me unpaid maintenance charges and send a reminder to those residents."*

```
Step 1: Read & Reason
─────────────────────────────────────────────────────────────────────────────
AgentRuntime begins AgentExecution (ID: exec-901, step: 1, status: RUNNING).
1. LLM decides to call tool: `get_unpaid_charges`.
2. AgentRuntime creates ToolExecutionContext(tenantId, userId, token, exec-901, step=1).
3. Tool `get_unpaid_charges` executes via Backend API.
4. Tool returns ToolResult with 2 delinquent tenants:
   - Tenant A: Flat 101, $150
   - Tenant B: Flat 204, $300
5. AgentRuntime writes ToolExecutionRecord(exec-901, step=1, tool="get_unpaid_charges", status=SUCCESS).
6. AgentRuntime updates AgentExecution(currentStep=1).

Step 2: Multi-Step Reason & Destructive Action Detection
─────────────────────────────────────────────────────────────────────────────
7. ToolResult is fed back to LLM.
8. LLM reasons: "I must now send reminders to Tenant A and Tenant B. I will call `send_payment_reminder`."
9. LLM emits tool call: `send_payment_reminder` for Tenant A and Tenant B.
10. AgentRuntime checks `ToolDefinition.isDestructive()` or `requiresHumanApproval()`.
    -> `send_payment_reminder` has `requiresHumanApproval = true` OR `isDestructive = true`.

State Suspension (Human-in-the-Loop Checkpoint)
─────────────────────────────────────────────────────────────────────────────
11. Because this affects external residents (sending SMS/email), AgentRuntime does NOT
    blindly execute.
12. AgentRuntime records pending action in ToolExecutionRecord(step=2, status=PENDING_APPROVAL).
13. AgentRuntime updates AgentExecution(status=WAITING_FOR_APPROVAL).
14. AgentRuntime returns AgentResult:
    "Found 2 residents with unpaid charges:
     - Tenant A (Flat 101): $150
     - Tenant B (Flat 204): $300
     Do you confirm sending payment reminders to them?"

Resumption After Confirmation
─────────────────────────────────────────────────────────────────────────────
15. Landlord replies: "Yes, send them."
16. AIController identifies existing `conversationId` and retrieves `AgentExecution` (exec-901).
17. AgentRuntime verifies:
    - Step 1 already succeeded (output retrieved from database; tool not re-executed).
    - Status is WAITING_FOR_APPROVAL.
18. AgentRuntime updates ToolExecutionRecord(step=2, status=EXECUTING).
19. AiTool: `send_payment_reminder` executes with ToolExecutionContext.
20. Backend notification service sends reminders and returns message reference IDs.
21. AgentRuntime records ToolExecutionRecord(step=2, status=SUCCESS).
22. AgentRuntime feeds result to LLM -> LLM returns final response: "Reminders successfully sent to Flat 101 and 204."
23. AgentExecution marked COMPLETED.
```

---

## 6. Architectural Questions & Answers

### 1. What is the difference between `AgentDefinition` and `Agent`?
* **`AgentDefinition`** is a **static descriptor/value object** (the blueprint). It defines metadata: system prompt, supported capabilities, allowed tools, role requirements, and model settings. It is stateless.
* **`Agent`** is the **operational component** (the service). It holds a reference to its `AgentDefinition`, binds to the `AgentRuntime`, and encapsulates execution lifecycle hooks for that specific agent category.

### 2. What is the difference between `AgentRouter` and `AgentRuntime`?
* **`AgentRouter`** answers: *"Which agent should handle this request?"* It examines intent, headers, or explicit agent tags, and selects the matching `Agent`. It exits once the target agent is found.
* **`AgentRuntime`** answers: *"How do we execute the agent loop?"* It runs the multi-turn prompt-response-tool iteration, enforces step limits, records step audits, and handles error recovery.

### 3. What is the difference between `AgentContext` and `AgentExecution`?
* **`AgentContext`** is **input context** (who is asking, under what tenant, what roles, what request headers). It is transient, created per HTTP/event trigger.
* **`AgentExecution`** is the **execution instance entity** (what happened during the run). It tracks the execution's lifecycle, step counters, status (`RUNNING`, `WAITING_FOR_APPROVAL`, `COMPLETED`), errors, and audit history. It is persisted.

### 4. Should `AgentRuntime` be stateful or stateless?
* **`AgentRuntime` must be strictly stateless.**
* It is a Spring singleton bean that operates on parameters passed to its methods (`execute(Agent agent, AgentContext ctx, Prompt prompt)`).
* All state lives in database entities (`AgentExecution`, `ToolExecutionRecord`) and the conversation memory store. This allows `ai-service` to scale horizontally behind a load balancer without sticky sessions.

### 5. Where should conversation state live?
* Conversation state (chat history: user, assistant, and tool messages) belongs in a dedicated **`ConversationMemoryStore`** backed by database persistence (e.g., MySQL via `ai_message_tbl` or Redis for caching).
* It must **never** be kept in in-memory static maps or Spring AI's default in-memory advisors, which leak memory and break across multiple service instances.

### 6. Where should execution state live?
* Execution state (the step-by-step progress of a multi-step task, tool arguments, tool responses, execution status) belongs in the **`persistence` module** via `AgentExecution` and `ToolExecutionRecord` database tables.

### 7. How do we resume a failed or paused multi-step execution?
* Every execution has an `executionId`. When a step fails (e.g., backend timeout) or pauses (waiting for human approval):
  1. `AgentExecution` status is set to `FAILED` or `WAITING_FOR_APPROVAL` with `currentStep` stored.
  2. Completed steps have their `ToolExecutionRecord` marked `SUCCESS`.
  3. Upon retry or user confirmation, `AgentRuntime.resume(executionId, resumeContext)` loads the execution entity and completed tool outputs, reconstructs the message history up to `currentStep`, and continues the loop from `currentStep + 1` without re-executing previous tools.

### 8. How do we prevent the LLM from calling unauthorized tools?
A two-layer defense-in-depth model:
1. **Pre-prompt Filtering (Prompt Shield):** `ToolRegistry.getAvailableToolsFor(agentContext, agentDef)` checks the user’s JWT roles and tenant entitlements against `ToolDefinition.requiredPermissions()`. Unauthorized tools are never converted into the LLM schema. The LLM does not even know they exist.
2. **Execution Interception (Runtime Shield):** If an LLM hallucinates or attempts to call an unregistered or forbidden tool name, `PolicyEnforcer.authorizeToolCall(toolName, agentContext)` rejects the call before invocation, returning a `ToolResult.denied()` into the loop.

### 9. How do we enforce tenant isolation?
* `AgentContext` carries `tenantId` extracted and verified from the authenticated JWT.
* The LLM is **never** trusted to provide the `tenantId`. Even if the user prompt specifies a property ID, the `ToolExecutionContext` injected into the tool forces the verified `tenantId`.
* When `AiTool` calls `BackendAdminClient`, it passes `X-Tenant-ID: {context.tenantId}` and `Authorization: Bearer {context.userToken}`. The core backend verifies tenant boundaries at the SQL/service level.

### 10. How do we distinguish read-only tools from write/destructive tools?
* `ToolDefinition` carries explicit metadata flags:
  * `boolean isReadOnly()`
  * `boolean isDestructive()`
  * `boolean requiresHumanApproval()`
* Read-only tools (e.g., `get_maintenance_issues`, `view_lease`) can be invoked immediately and automatically in the loop.
* Destructive/write tools (e.g., `create_property`, `send_payment_reminder`, `terminate_lease`) trigger approval policies in `AgentRuntime`, enabling automated checks, rate-limiting, and human approval workflows.

### 11. Where would human approval fit later?
* In `AgentRuntime`, right before invoking an `AiTool` whose `ToolDefinition.requiresHumanApproval()` is `true`:
  1. The runtime generates a pending `ToolExecutionRecord` with status `WAITING_FOR_APPROVAL`.
  2. An `AgentApprovalRequiredEvent` is published to notify the landlord via UI or WebSocket.
  3. `AgentExecution` status is set to `WAITING_FOR_APPROVAL`.
  4. Once approved via an API endpoint (`/api/v1/ai/executions/{id}/approve`), the runtime picks up the execution, runs the tool, and completes the loop.

### 12. How can the same tool eventually be exposed through MCP without rewriting the tool?
* Because `AiTool` is a pure domain interface (`execute(ToolExecutionContext, T input)` with a metadata method `ToolDefinition getDefinition()`), it has zero dependencies on Spring AI annotations or HTTP controllers.
* An `mcp` module adapter simply scans all `AiTool` beans and registers them as MCP tool endpoints (e.g., JSON-RPC `tools/list` and `tools/call`). The exact same `PropertyTool` or `MaintenanceTool` can serve both internal LLM agents and external MCP clients without modifying a single line of tool code.

### 13. How can we replace Gemini with another model later without changing `AgentRuntime`?
* `AgentRuntime` depends strictly on an internal domain interface: `ModelClient` (e.g., `chat(ModelRequest): ModelResponse`).
* Adapters implement this interface:
  * `SpringAiModelClientAdapter` (delegates to Spring AI `ChatClient` / Google GenAI starter)
  * `OpenAiModelClientAdapter` (delegates to OpenAI / Azure OpenAI)
  * `AnthropicModelClientAdapter` (delegates to Claude)
* `AgentRuntime` is completely agnostic to whether the underlying provider is Gemini 1.5/2.0, Claude 3.5, or GPT-4o. Model switching is configured via property flags (`app.ai.model-provider=gemini`).

### 14. Which abstractions should belong to our domain and which should be adapters around Spring AI?
* **Livic Domain Core (Zero Spring AI dependencies):**
  * `AgentDefinition`, `Agent`, `AgentContext`, `AgentResult`, `AgentRegistry`, `AgentRouter`, `AgentRuntime`, `AiTool`, `ToolDefinition`, `ToolRegistry`, `ToolExecutionContext`, `ToolResult`, `AgentExecution`, `ToolExecutionRecord`.
* **Adapters / Infrastructure (Imports Spring AI):**
  * `SpringAiModelClientAdapter` (bridges domain `ModelClient` to Spring AI `ChatModel` or `ChatClient`).
  * `SpringAiToolAdapter` (bridges domain `AiTool` to Spring AI `ToolCallback` or function definitions).
  * `SpringAiVectorStoreAdapter` (bridges domain `KnowledgeStore` to Spring AI `VectorStore`).

---

## 7. Structural Tables & Classification

### Responsibility Matrix

| Abstraction | Primary Responsibility | Anti-Responsibility (What it MUST NOT do) |
|---|---|---|
| **AgentDefinition** | Declares agent metadata, prompt template, tool names, and constraints. | Must not manage runtime state or call LLMs. |
| **Agent** | High-level logical handle for an agent capability. | Must not perform low-level prompt construction or HTTP transport. |
| **AgentContext** | Encapsulates caller identity, tenant isolation, and security tokens. | Must not hold LLM prompt history or tool outputs. |
| **AgentResult** | Uniform output envelope with final response, status, and metrics. | Must not expose internal Spring AI classes to callers. |
| **AgentRegistry** | Catalog of all registered agents for discovery. | Must not make routing decisions or execute tools. |
| **AgentRouter** | Routes user prompt/intent to the most appropriate Agent. | Must not run the agent loop or execute tools. |
| **AgentRuntime** | Drives the ReAct loop, coordinates LLMs, tools, and step state. | Must not contain tool business logic or direct DB access. |
| **AiTool** | Implements a business capability by talking to backend APIs. | Must not determine when it is called or enforce role permissions. |
| **ToolDefinition** | Describes tool schemas, capabilities, and safety flags to LLM. | Must not contain execution logic or network parameters. |
| **ToolRegistry** | Manages available tools and filters them by user permissions. | Must not execute the tools. |
| **ToolExecutionContext** | Supplies execution context (token, tenantId, step) to tools. | Must not parse tool arguments or format LLM responses. |
| **ToolResult** | Standardized domain outcome of a tool execution. | Must not directly serialize prompts for the LLM. |
| **AgentExecution** | Tracks full execution lifecycle, status, and state across steps. | Must not execute business logic. |
| **ToolExecutionRecord** | Immutable audit log of a single tool execution step. | Must not decide orchestration flow. |

### Abstraction Types & State Persistence

| Abstraction | Type | Lifecycle State | Storage Mechanism |
|---|---|---|---|
| `AgentDefinition` | **Class** (Record/POJO) | Static / Loaded | In-memory configuration |
| `Agent` | **Interface** | Static / Managed | Spring Container Bean |
| `AgentContext` | **Class** (Record) | Transient | Request memory |
| `AgentResult` | **Class** (Record) | Transient | HTTP response payload |
| `AgentRegistry` | **Interface** | Static / Managed | Spring Container Singleton |
| `AgentRouter` | **Interface** | Static / Managed | Spring Container Singleton |
| `AgentRuntime` | **Interface** | Stateless / Managed | Spring Container Singleton |
| `AiTool` | **Interface** | Stateless / Managed | Spring Container Singleton Beans |
| `ToolDefinition` | **Class** (Record) | Static / Loaded | In-memory metadata |
| `ToolRegistry` | **Interface** | Static / Managed | Spring Container Singleton |
| `ToolExecutionContext` | **Class** (Record) | Transient | Step-scoped memory |
| `ToolResult` | **Class** (Record) | Transient -> Persisted | Persisted into `ToolExecutionRecord` |
| `AgentExecution` | **Class** (Entity) | Persisted | Database: `ai_execution_tbl` |
| `ToolExecutionRecord` | **Class** (Entity) | Persisted | Database: `ai_tool_execution_record_tbl` |

---

## 8. The 7 Foundational Contracts to Freeze

Before writing any implementation code or integrating Spring AI APIs, these 7 contracts must be frozen:

1. **`AgentContext`**: Defines caller identity, tenant isolation, and security attributes.
2. **`AiTool` & `ToolDefinition`**: The contract every business capability implements.
3. **`ToolExecutionContext` & `ToolResult`**: The input and output contracts for tool execution.
4. **`ModelClient`**: The decoupled contract separating `AgentRuntime` from Spring AI and LLM providers.
5. **`AgentRuntime`**: The orchestration interface driving the reasoning loop.
6. **`AgentExecution` & `ToolExecutionRecord`**: The data models representing execution and audit history.
7. **`PolicyEnforcer`**: The security gatekeeper preventing unauthorized tool calls and tenant leaks.

---

# PART II: Spring AI Integration Boundary & Technical Subsystems

## 9. LLM Abstraction & Provider Independence

To ensure `AgentRuntime` and domain `Agent` implementations remain completely insulated from LLM provider quirks and framework churn, Livic uses an explicit boundary between domain orchestration and model execution.

```
┌────────────────────────────────────────────────────────┐
│               Livic AI Domain (Pure Java)              │
│                                                        │
│                    AgentRuntime                        │
│                         │                              │
│                         ▼                              │
│                    LlmGateway                          │
│             (chat, generateStructured)                 │
└─────────────────────────┬──────────────────────────────┘
                          │ passes ModelRequest
                          ▼ returns ModelResponse
┌────────────────────────────────────────────────────────┐
│         Adapter Layer (com.livic.ai.llm.adapter)       │
│                                                        │
│               SpringAiLlmGateway                       │
│                         │                              │
│                         ▼                              │
│            ChatClient / ChatModel (Spring AI)          │
└─────────────────────────┬──────────────────────────────┘
                          │ HTTP / gRPC
                          ▼
            [ Google Gemini / OpenAI / Anthropic ]
```

### Analysis of LLM Subsystem Abstractions

| Concept | Necessary? | Ownership | Spring AI Equivalent | Decision & Architectural Rationale |
|---|---|---|---|---|
| **`LlmGateway`** | **YES (Mandatory)** | Livic Domain (`llm`) | None (Spring AI mixes client & fluent API) | **Keep as pure Livic interface.** Single contractual entry point for `AgentRuntime`. Methods: `chat(ModelRequest): ModelResponse` and `generateDecision(ModelRequest, Class<T>): T`. |
| **`ModelRequest`** | **YES (Mandatory)** | Livic Domain (`llm`) | `Prompt` / `ChatOptions` | **Keep as Livic value object (record).** Contains messages (system, user, tool observations), temperature, max tokens, tool definitions, and metadata tags (tenant, correlationId). Shields domain from Spring AI's message hierarchy. |
| **`ModelResponse`** | **YES (Mandatory)** | Livic Domain (`llm`) | `ChatResponse` | **Keep as Livic value object (record).** Standardizes content text, tool calls requested, token consumption (input/output/total), model name, and finish reason (`STOP`, `TOOL_CALL`, `MAX_TOKENS`). |
| **`ModelProvider`** | **YES (Enum)** | Livic Domain (`llm`) | Configuration strings | **Keep as Livic Enum.** (`GEMINI`, `OPENAI`, `ANTHROPIC`, `OLLAMA`). Used for routing, billing, telemetry, and selecting adapter profiles. |
| **`ChatModel`** | **NO (Do not create)** | Spring AI | `org.springframework.ai.chat.model.ChatModel` | **Do not wrap or duplicate.** `ChatModel` is Spring AI’s low-level SPI. Our `SpringAiLlmGateway` directly uses Spring AI’s configured `ChatModel` or `ChatClient` bean under the hood. |
| **`ModelRouter`** | **YES (Lean interface)**| Livic Domain (`llm`) | None | **Keep as Livic interface.** Decides *which* model tier (`FAST`, `REASONING`, `STRICT_SECURITY`) a request should route to based on task complexity and tenant tier. |
| **`PromptManager`** | **NO (Separate into PromptRepository & PromptTemplate)** | Livic Domain (`prompt`) | `PromptTemplate` | A monolithic "PromptManager" becomes an anti-pattern. Instead, use a simple `PromptTemplateEngine` and `AgentDefinition.systemPromptTemplate()`. |

### Zero-Code Provider Switching (Gemini → OpenAI → Anthropic)

To switch models without modifying `AgentRuntime` or any `Agent`:

1. **Provider Independence via Inversion of Control**: `AgentRuntime` only injects `LlmGateway`.
2. **Spring AI Auto-Configuration Selection**: In Spring Boot `application.yml`, activating a profile (or changing a property `app.ai.active-provider=openai`) switches the underlying Spring AI starter bean (`OpenAiChatModel` vs. `GoogleGenAiChatModel`).
3. **Gateway Translation**: `SpringAiLlmGateway` maps Livic's `ModelRequest` into Spring AI's builder:
   ```
   ModelRequest ──> SpringAiLlmGateway ──> ChatClient.mutate().model(...) ──> Provider API
   ```
4. **Tool Compatibility**: Tool schemas are translated at runtime into standard JSON Schema via OpenAPI/JSON Schema generators, which both Gemini Function Calling and OpenAI Tools accept identically.

---

## 10. Spring AI `ChatClient` Placement & Lifecycle

A critical architectural flaw in naïve Spring AI apps is treating `ChatClient` as a shared mutable state or recreating it on every single user message without caching.

```
                       ┌───────────────────────────────┐
                       │     ChatClient.Builder        │
                       │     (Spring Boot Singleton)   │
                       └───────────────┬───────────────┘
                                       │
                                       │ builds
                                       ▼
                       ┌───────────────────────────────┐
                       │      Base ChatClient          │
                       │   (Pre-configured with        │
                       │    default advisor chains)    │
                       └───────────────┬───────────────┘
                                       │
                           mutate() per execution
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 SpringAiLlmGateway.chat(ModelRequest request)               │
│                                                                             │
│   ChatClient client = baseChatClient.mutate()                               │
│       .defaultSystem(request.systemPrompt())        // Dynamic per agent    │
│       .build();                                                             │
│                                                                             │
│   ChatResponse response = client.prompt()                                   │
│       .user(request.userPrompt())                   // Dynamic per message  │
│       .tools(request.toolCallbacks())               // Filtered per user    │
│       .options(chatOptions)                         // Temp, model tier     │
│       .call()                                                               │
│       .chatResponse();                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Placement Matrix

| Element | Location / Scope | Lifecycle | Rationale |
|---|---|---|---|
| **`ChatClient.Builder`** | Injected Spring Bean | Singleton | Initialized at startup with base timeouts, HTTP connection pools, and tracing interceptors. |
| **`Base ChatClient`** | Inside `SpringAiLlmGateway` | Singleton | Represents the un-mutated baseline client. |
| **Model Configuration** | Spring properties & `ModelRequest` | Dynamic | Base model set in config (`application.yml`); overridden per request via `ModelRequest.temperature()` and `ModelRequest.modelTier()`. |
| **System Prompts** | `AgentDefinition` + Runtime Assembler | Per Request | Assembled per execution from `AgentDefinition.systemPromptTemplate()`, tenant variables, and agent guidelines. |
| **User Messages** | `ModelRequest.messages()` | Per Turn | Passed in the request payload as `UserMessage`. |
| **Conversation Context** | `ConversationMemoryStore` | Per Turn | Injected into `ModelRequest.messages()` as chronological `HistoryMessage` elements before LLM dispatch. |
| **Tool Definitions** | `ToolRegistry` via `PolicyEnforcer` | Per Turn | Filtered dynamically based on caller role/tenant, then converted to Spring AI `ToolCallback` definitions on the prompt. |

---

## 11. Tool Calling Adapter Architecture

The LLM must **never** receive raw Java beans, database entities, or Spring AI internals. Livic isolates tool execution into an adapter pattern that bridges domain tools to Spring AI tool calling.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Livic Domain Tool Framework                        │
│                                                                         │
│   ToolRegistry ──────> PolicyEnforcer ──────> AiTool                    │
│   (All tools)          (RBAC + Tenant)        (execute(context, input)) │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ registers allowed tools
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Spring AI Tool Adapter Layer                        │
│                                                                         │
│                       SpringAiToolAdapter                               │
│         Wraps AiTool into Spring AI's ToolCallback interface            │
│                                                                         │
│  1. getToolDefinition() ──> Translates to Spring AI ToolDefinition      │
│  2. call(jsonArguments) ──> Intercepts invocation                       │
│                             Validates JSON schema                       │
│                             Injects ToolExecutionContext                │
│                             Invokes AiTool.execute(...)                 │
│                             Transforms ToolResult to JSON string        │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ passes tool definitions & callbacks
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   Spring AI ChatClient / Provider API                   │
│                                                                         │
│                     LLM Model (Gemini / OpenAI)                         │
│                    Decides function call & inputs                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Inbound & Outbound Execution Boundary

```
1. LLM requests tool:
   LLM JSON Tool Call: {"name": "get_maintenance_issues", "arguments": "{\"propertyId\":\"p-101\"}"}
        │
        ▼
2. Spring AI runtime intercepts call and routes to registered `SpringAiToolAdapter`.
        │
        ▼
3. `SpringAiToolAdapter`:
   a. Extracts `ToolExecutionContext` from thread context (or request scope).
   b. Invokes `PolicyEnforcer.assertAuthorized(context, toolName)`.
   c. Deserializes raw JSON arguments into the typed Input DTO declared by `AiTool`.
   d. Invokes domain `AiTool.execute(context, typedInput)`.
        │
        ▼
4. `AiTool` executes via `BackendAdminClient` over authenticated HTTP with relayed tenant token.
        │
        ▼
5. `AiTool` returns domain `ToolResult`.
        │
        ▼
6. `SpringAiToolAdapter`:
   a. Records step into `ToolExecutionRecord` (persisted to DB).
   b. Serializes sanitized `ToolResult.data()` or `summaryText` into a plain JSON string for the LLM.
        │
        ▼
7. Spring AI delivers serialized string back to LLM as a `ToolResponseMessage`.
```

---

## 12. Tool Schema & Ownership Matrix

| Responsibility | Component Owner | How It Is Handled Without Leaking Spring AI |
|---|---|---|
| **Tool Name** | `ToolDefinition` (Livic) | Explicit domain string constant (e.g., `maintenance_get_open_tickets`). Unique across the system. |
| **Description** | `ToolDefinition` (Livic) | Explicit natural language prompt guidance detailing when and why the tool should be called. |
| **Input Schema** | `AiTool` Typed DTO (Livic) | Standard Java DTO (e.g., `GetMaintenanceTicketsInput`) inspected via Jackson/JSON Schema Generator to produce an OpenAPI/JSON schema. |
| **Input Validation** | `AiTool` + Jakarta Validation | Standard Bean Validation annotations (`@NotNull`, `@Size`, `@Pattern`) on the DTO. Validated before tool execution. |
| **Authorization Check** | `PolicyEnforcer` (Livic) | Validates user role and tenant permissions *before* schema generation (pre-filter) and *before* execution (runtime guard). |
| **Output Sanitization** | `ToolResult` (Livic) | `ToolResult.toModelPayload()` converts internal data to LLM-friendly JSON, omitting backend-only sensitive fields (e.g., internal DB IDs, secrets). |
| **Error Handling** | `SpringAiToolAdapter` (Livic) | Catches business and connection exceptions, maps them to `ToolResult.error("User-friendly reason")`, and gives the LLM a chance to recover rather than crashing the request. |

---

## 13. Output Modalities: Text vs. Structured Decisions vs. Tools

```
                           Incoming Agent Goal
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
[1. Conversation / Q&A]     [2. Action Execution]      [3. Orchestration Route]
   "What is our pet policy?"   "Send reminder to flat 10"  "Classify user request"
        │                           │                           │
        ▼                           ▼                           ▼
 Mode: Standard Text         Mode: Native Tool Call      Mode: Structured Output
 Model returns markdown      Model emits function call   Model returns validated
 streamed to UI              with arguments              Decision DTO (JSON)
```

1. **Standard Text Output**:
   * *When:* Answering informational queries, summarizing tickets, conversational banter, or explaining policy.
   * *Spring AI Role:* Standard `chatClient.prompt().user(...).call().content()`.
2. **Native Tool Calling (Function Calling)**:
   * *When:* Interacting with backend systems (fetching invoices, creating work orders, dispatching SMS).
   * *Spring AI Role:* Provider-native tool calling via `chatClient.prompt().tools(...)`. The model guarantees valid schema invocation.
3. **Structured Output (Schema-Enforced JSON)**:
   * *When:* Decision classification, multi-intent extraction, routing, or when `AgentRuntime` needs an explicit structured plan before executing tools (`AgentDecision`).
   * *Spring AI Role:* `chatClient.prompt().entity(AgentDecision.class)` using `BeanOutputConverter`.

---

## 14. Prompt Architecture & Versioning

```
┌─────────────────────────────────────────────────────────────┐
│                    Prompt Assembly Engine                   │
│                                                             │
│   1. Base System Persona (Safety, tone, role)               │
│   2. Agent Instructions (from AgentDefinition)              │
│   3. Tenant Guidelines (custom property rules from DB)      │
│   4. Execution Context (current date, user role, channel)   │
│   5. Few-Shot Examples (domain-specific patterns)           │
│   6. Conversation History (from ConversationMemory)         │
│   7. Grounded Context / RAG (from KnowledgeRetriever)       │
│   8. Latest User Message                                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ compiles into
                               ▼
                         ModelRequest
```

* **`PromptRepository`**: Storage abstraction for retrieving prompt templates by `agentId` and `version`.
* **`PromptTemplate`**: Domain value object with placeholder tokens (e.g., `{{tenantName}}`, `{{currentDate}}`, `{{userRole}}`).
* **`AgentInstructions`**: The static task-specific instructions specified in `AgentDefinition`.
* **Prompt Versioning**: Each prompt template has a semantic version (e.g., `maintenance_agent_system:v2.1`), tagged in `ModelRequest.metadata()` and permanently recorded in `AgentExecution` for auditability and A/B evaluation.

---

## 15. Conversation Memory Boundary

```
┌──────────────────────────────────────────────────────────────┐
│                    Livic Memory Boundary                     │
│                                                              │
│  ConversationMemoryStore (Livic Interface)                   │
│  ├── getRecentMessages(conversationId, limit): List<Message> │
│  ├── appendMessage(conversationId, Message): void            │
│  └── clear(conversationId): void                             │
└──────────────────────────────┬───────────────────────────────┘
                               │ implemented by
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                Persistence Layer (JPA / Redis)               │
│                                                              │
│  `ai_conversation_message_tbl`                               │
│  (id, conversation_id, role, content, tool_calls, created_at)│
└──────────────────────────────┬───────────────────────────────┘
                               │ loaded on request
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                  Assembled ModelRequest                      │
│                                                              │
│  Messages sent to Spring AI ChatClient:                      │
│  [SystemMessage] -> [PastUserMsg] -> [PastAssistantMsg] ->   │
│  [LatestUserMsg]                                             │
└──────────────────────────────────────────────────────────────┘
```

* **Spring AI Role**: Translates Livic messages to underlying provider format (`UserMessage`, `AssistantMessage`, `SystemMessage`, `ToolResponseMessage`).
* **Livic Domain Role**: Persistent database storage in `ai_conversation_message_tbl`, sliding window token truncation, tenant isolation, and PII masking. Spring AI’s in-memory advisors are bypassed.

---

## 16. RAG & Knowledge Retrieval Boundary

```
┌────────────────────────────────────────────────────────┐
│              Livic Domain Knowledge Layer              │
│                                                        │
│                  KnowledgeRetriever                    │
│     (retrieveGroundedContext(tenantId, query, k))      │
└───────────────────────────┬────────────────────────────┘
                            │ delegates
                            ▼
┌────────────────────────────────────────────────────────┐
│               Spring AI VectorStore Adapter            │
│                                                        │
│               SpringAiKnowledgeAdapter                 │
│                          │                             │
│                          ▼                             │
│       org.springframework.ai.vectorstore.VectorStore   │
│                          │                             │
│                          ▼                             │
│          PgVector / Milvus / Redis Vector              │
└────────────────────────────────────────────────────────┘
```

* **Livic Domain Owns**: `KnowledgeRetriever` contract. Enforces mandatory tenant isolation filter (`metadata.tenant_id == {context.tenantId}`) on every query before execution.
* **Spring AI Owns**: `EmbeddingModel` and `VectorStore` SPI adapters.

---

## 17. Model Routing Strategy

* `ModelRouter` belongs in `com.livic.ai.llm` (LLM layer), not inside `AgentRuntime` or Spring AI adapters.
* Resolves `ModelTier.FAST` (e.g., Gemini Flash for classification and simple Q&A), `ModelTier.REASONING` (e.g., Gemini Pro for multi-step tool calls), and `ModelTier.CONTROLLED` (strict parameter validation for sensitive actions) against tenant quotas and provider health.

---

## 18. Security Boundary: The Guaranteed Invocation Pipeline

> **Can the LLM ever bypass our authorization layer?**
> **NO.** The LLM has zero execution capability. It only outputs text strings requesting a tool name. The execution pipeline is strictly governed by Java code:

```
LLM Model Output
  │ emits ToolCall: "create_property"
  ▼
SpringAiToolAdapter (intercepts)
  │
  ▼
PolicyEnforcer (validates roles, tenant entitlement, approval flags)
  │
  ├─► [FAILS]  ──► Return ToolResult.denied() to LLM without running tool
  │
  └─► [PASSES] ──► Injects ToolExecutionContext (verified tenantId, userToken)
                     │
                     ▼
                   AiTool.execute(toolCtx, typedInput)
                     │
                     ▼
                   BackendAdminClient (HTTP with X-Tenant-ID & Bearer Token)
                     │
                     ▼
                   Livic Core Backend DB (Sole Source of Truth)
```

1. **Zero DB Access**: `ai-service` has no JPA dependencies or credentials for core business tables (`property_tbl`, `tenancy_tbl`).
2. **Pre-Invocation Filtering**: `ToolRegistry` hides forbidden tool schemas from the LLM prompt.
3. **Runtime Policy Enforcement**: `PolicyEnforcer` blocks hallucinated or unauthorized tool names before invocation.
4. **Tenant Isolation by Construction**: Tools read `tenantId` strictly from `ToolExecutionContext`, never from LLM-generated arguments.

---

## 19. Observability Split

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Observability Split                              │
├────────────────────────────────────┬────────────────────────────────────┤
│    Persistent Audit (Relational)   │  Operational Metrics (Prometheus)  │
├────────────────────────────────────┼────────────────────────────────────┤
│ - AgentExecution entity            │ - Gauge: active_executions         │
│ - ToolExecutionRecord entity       │ - Timer: llm_request_duration_ms   │
│ - Exact input prompt & final text  │ - Timer: tool_execution_duration_ms│
│ - Full tool JSON arguments & data  │ - Counter: tokens_total (by model) │
│ - Approver userId & timestamps     │ - Counter: tool_call_errors_total  │
│ - Target tenantId & correlationId  │ - Counter: model_throttling_total  │
└────────────────────────────────────┴────────────────────────────────────┘
```

---

## 20. The Litmus Test

### *"If Spring AI disappeared tomorrow, which parts of our Livic architecture should remain unchanged?"*

#### 100% Intact & Unchanged:
* All domain contracts: `AgentDefinition`, `Agent`, `AgentRuntime`, `AgentContext`, `AgentResult`.
* All tool contracts: `AiTool`, `ToolDefinition`, `ToolRegistry`, `ToolExecutionContext`, `ToolResult`.
* All business tools: `PropertyTool`, `MaintenanceTool`, `BillingTool`.
* All persistence entities: `AgentExecution`, `ToolExecutionRecord`, `ai_conversation_message_tbl`.
* All security gatekeepers: `PolicyEnforcer`, `TenantContext`.
* All backend HTTP communication: `BackendAdminClient`.

#### Only Adapter Classes That Would Be Replaced:
* `SpringAiLlmGateway` (replaced by direct provider SDK gateway).
* `SpringAiToolAdapter` (replaced by provider tool serializer).
* `SpringAiKnowledgeAdapter` (replaced by native vector client).

---

# PART III: Agent Runtime, Execution Engine & Workflows

## 21. The Agent Execution Loop & Two-Tier Hybrid Architecture

In real-world property management workflows, user requests span from simple informational lookups to high-stakes multi-step operations (e.g., finding delinquent accounts, calculating penalties, requesting landlord confirmation, and dispatching SMS reminders).

Naively collapsing this into an unconstrained `while (true)` ReAct loop causes:
1. High token burn and latency.
2. Unpredictable tool call drift.
3. Inability to checkpoint, suspend for human approval, or safely resume after a node crash.

### Recommended Loop Pattern: The Two-Tier Hybrid Loop

```
                       User Prompt
                            │
                            ▼
                  ┌───────────────────┐
                  │    AgentRouter    │
                  └─────────┬─────────┘
                            │ selects Agent
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        AgentRuntime                         │
│  (State Machine Orchestrator & Lifecycle Coordinator)       │
│                                                             │
│   Execution Mode Decision:                                  │
│   ├── Is it a single-turn / read-only intent?               │
│   │     └──► Fast-Path ReAct Loop                           │
│   │                                                         │
│   └── Does it involve side-effects / multi-step writes?     │
│         └──► Plan-and-Execute Loop                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      ExecutionEngine                        │
│  (Step Dispatcher, Retry Guard, Idempotency Enforcer)       │
│                                                             │
│   Step 1 (READ) ──► Observe ──► Checkpoint State (DB)       │
│   Step 2 (PLAN) ──► Identify Side Effect ──► Suspend (DB)   │
│   Step 3 (WAIT) ──► Human Approval Received                 │
│   Step 4 (EXEC) ──► Idempotent Tool Execution ──► Complete  │
└─────────────────────────────────────────────────────────────┘
```

* **Decouples State Machine from Step Execution**: `AgentRuntime` manages the high-level request lifecycle, conversation memory, and terminal state transitions. `ExecutionEngine` is the deterministic worker executing individual steps against tools.
* **Separation of Concerns**: The LLM determines *what* to do (Plan/Reasoning); the deterministic `ExecutionEngine` controls *how* and *when* it executes (Idempotency, Retries, Policy Enforcement).

---

## 22. AgentRuntime: Boundaries & Responsibilities

`AgentRuntime` is the **stateless coordinator** of the entire execution. It owns the execution lifecycle, but delegates mechanical step dispatching to `ExecutionEngine`.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              AgentRuntime                               │
├────────────────────────────────────┬────────────────────────────────────┤
│           WHAT IT OWNS             │       WHAT IT MUST NOT OWN         │
├────────────────────────────────────┼────────────────────────────────────┤
│ 1. Starting an execution           │ 1. Tool business logic             │
│ 2. Constructing AgentExecution     │ 2. Direct HTTP / REST client calls │
│ 3. Resolving model via ModelRouter │ 3. Direct DB entity manipulation   │
│ 4. Enforcing max step / time limits│ 4. Generating tool JSON schemas    │
│ 5. Coordinating human approval     │ 5. Hardcoded provider client code  │
│ 6. Terminal state transitions      │ 6. Batch job scheduling algorithms │
│ 7. Producing final AgentResult     │ 7. Long-term thread blocking       │
└────────────────────────────────────┴────────────────────────────────────┘
```

---

## 23. Planner Evaluation: Progressive Step-State Machine

### Comparison of Approaches

* **Option A: Pure ReAct Loop (`while tool_calls present -> execute`)**: Simple, but non-deterministic, hallucination-prone for sequences > 3 steps, and cannot reliably show landlords a preview of planned actions before execution.
* **Option B: Pure Upfront Plan-and-Execute (`LLM generates full 5-step DAG upfront`)**: Explicit, but brittle because Step 2’s inputs often depend strictly on Step 1’s runtime output (e.g., cannot plan which tenant IDs to message until Step 1 queries the overdue ledger).
* **Option C: Hybrid (Progressive Intent-Action Planner) — RECOMMENDED FOR LIVIC**:
  * **Phase 1 (Discovery/Read)**: ReAct discovery to collect facts (e.g., query database for unpaid fees).
  * **Phase 2 (Proposed Plan Generation)**: LLM outputs an explicit `ProposedActionPlan` (target residents, amounts, message template).
  * **Phase 3 (Checkpoint & Verification)**: System evaluates if write tools exist in the plan. If yes, it holds for human approval.
  * **Phase 4 (Deterministic Execution)**: `ExecutionEngine` iterates through approved actions using idempotency keys.

> **Decision**: For V1, avoid complex graph DAG frameworks (like LangGraph/AutoGPT). Use a **Step-State Machine** where `AgentRuntime` controls ReAct cycles and transitions into `WAITING_FOR_APPROVAL` when an action is tagged as `DESTRUCTIVE` or `EXTERNAL_SIDE_EFFECT`.

---

## 24. Execution Plan & Step Model

```
                          ┌────────────────────────┐
                          │     ExecutionPlan      │
                          │ - planId: UUID         │
                          │ - executionId: UUID    │
                          │ - status: PlanStatus   │
                          │ - steps: List<Step>    │
                          └───────────┬────────────┘
                                      │ 1
                                      │ has many
                                      ▼ *
                          ┌────────────────────────┐
                          │     ExecutionStep      │
                          │ - stepNumber: int      │
                          │ - toolName: String     │
                          │ - inputPayload: JSON   │
                          │ - state: StepStatus    │
                          │ - idempotencyKey: str  │
                          │ - retryCount: int      │
                          └────────────────────────┘
```

* **What is a Step?** A step represents a **single unit of tool execution** bound to a specific input payload, correlated with an LLM reasoning decision.
* **Capabilities**:
  * **Dependencies**: Step inputs can reference outputs of previous steps via step context interpolation (e.g., `{{steps[1].output.delinquentTenantIds}}`).
  * **Conditionals**: If Step 1 returns an empty list, subsequent steps are marked `SKIPPED`.
  * **Retries**: Permitted only if the tool is declared idempotent or returns a retryable error code.
  * **Sequential in V1**: Sequential step execution is enforced to prevent race conditions in financial operations.

---

## 25. Execution State Machine & Lifecycle Transitions

```
              ┌───────────────┐
              │    CREATED    │
              └───────┬───────┘
                      │ start()
                      ▼
              ┌───────────────┐
              │    RUNNING    │◄────────────────────────┐
              └───────┬───────┘                         │
                      │                                 │
         ┌────────────┴────────────┐                    │
         ▼                         ▼                    │ resume() /
  [Tool Called]             [Approval Needed]           │ tool done
         │                         │                    │
         ▼                         ▼                    │
┌─────────────────┐       ┌─────────────────┐           │
│WAITING_FOR_TOOL │       │WAITING_FOR_     │           │
│                 │       │APPROVAL         │           │
└────────┬────────┘       └────────┬────────┘           │
         │                         │                    │
         │ tool returns            ├─► REJECTED ──┐     │
         ▼                         │              │     │
┌─────────────────┐                │ approved     │     │
│ TOOL_COMPLETED  ├────────────────┴──────────────┴─────┘
└────────┬────────┘
         │
         ├───► [No more steps / LLM stops] ──► COMPLETED
         ├───► [Max steps exceeded]        ──► FAILED (MAX_STEPS_EXCEEDED)
         ├───► [Unrecoverable Error]       ──► FAILED
         ├───► [Timeout]                   ──► TIMED_OUT
         └───► [User cancels]              ──► CANCELLED
```

| State | Semantic Meaning | Transition In | Transition Out | Persisted? | Resumable? |
|---|---|---|---|---|---|
| **`CREATED`** | Execution record generated, context assembled. | `AIController` or Event Trigger | `RUNNING` | Yes | Yes |
| **`RUNNING`** | Active reasoning or step evaluation underway. | `CREATED`, `TOOL_COMPLETED`, `WAITING_FOR_APPROVAL` | `WAITING_FOR_TOOL`, `WAITING_FOR_APPROVAL`, `COMPLETED`, `FAILED` | Yes | Yes |
| **`WAITING_FOR_TOOL`** | Asynchronous or blocking tool invocation dispatched. | `RUNNING` | `TOOL_COMPLETED`, `FAILED`, `TIMED_OUT` | Yes | Yes |
| **`TOOL_COMPLETED`** | Tool execution recorded, feeding observation to LLM. | `WAITING_FOR_TOOL` | `RUNNING` | Yes | Yes |
| **`WAITING_FOR_APPROVAL`** | Execution suspended pending human decision. | `RUNNING` | `RUNNING` (Approved), `CANCELLED` (Rejected) | Yes | **YES (Key Milestone)** |
| **`COMPLETED`** | Goal achieved, final text generated. | `RUNNING` | None (Terminal) | Yes | No |
| **`FAILED`** | Unrecoverable error, timeout, or policy violation. | Any active state | None (Terminal) | Yes | Optional retry |
| **`CANCELLED`** | User or landlord explicitly rejected/cancelled. | Any active state | None (Terminal) | Yes | No |
| **`TIMED_OUT`** | Hard wall-clock limit reached (> 90s). | Any active state | None (Terminal) | Yes | No |

---

## 26. Distributed Persistence & Crash Recovery

```
Node A (Crashes)
  Step 1: Get Overdue Accounts ──► Recorded in DB (SUCCESS)
  Step 2: Calculate Penalties   ──► Recorded in DB (SUCCESS)
  Step 3: Render Notifications  ──► Recorded in DB (SUCCESS)
  ─── [NODE CRASH / OUT OF MEMORY] ───

Node B (Recovery Worker / Scheduled Monitor)
  1. Detects `AgentExecution` in `RUNNING` or `WAITING_FOR_TOOL` with heartbeat expired (> 60s).
  2. Loads `AgentExecution` (currentStep = 3).
  3. Queries `ToolExecutionRecord` for executionId = exec-101.
  4. Confirms Steps 1, 2, 3 have status = SUCCESS.
  5. Reconstructs conversation history containing the 3 successful tool outputs.
  6. Dispatches to LLM to continue loop at Step 4 WITHOUT re-executing Steps 1–3.
```

### Relational Schema Design

```sql
-- Execution Master Table
CREATE TABLE ai_execution_tbl (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    agent_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    current_step INT NOT NULL DEFAULT 0,
    max_steps INT NOT NULL DEFAULT 10,
    prompt TEXT NOT NULL,
    final_response TEXT,
    error_message TEXT,
    heartbeat_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    INDEX idx_ai_exec_tenant_status (tenant_id, status),
    INDEX idx_ai_exec_heartbeat (status, heartbeat_at)
);

-- Immutable Tool Execution Audit Table
CREATE TABLE ai_tool_execution_record_tbl (
    id VARCHAR(36) PRIMARY KEY,
    execution_id VARCHAR(36) NOT NULL,
    step_number INT NOT NULL,
    tool_name VARCHAR(64) NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    input_payload JSON NOT NULL,
    output_payload JSON,
    status VARCHAR(32) NOT NULL, -- PENDING, EXECUTING, SUCCESS, FAILED
    duration_ms BIGINT,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_ai_tool_exec FOREIGN KEY (execution_id) REFERENCES ai_execution_tbl(id),
    UNIQUE KEY uk_exec_step (execution_id, step_number)
);
```

---

## 27. Idempotency Architecture

```
                     ┌───────────────────────────────┐
                     │         AgentRuntime          │
                     └───────────────┬───────────────┘
                                     │
         Generates deterministic Idempotency Key:
         MD5(executionId + stepNumber + toolName + hash(inputArgs))
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │      SpringAiToolAdapter      │
                     └───────────────┬───────────────┘
                                     │
             Checks `ai_tool_execution_record_tbl`
             for existing key in SUCCESS state?
                                     │
                 ┌───────────────────┴───────────────────┐
                 │ YES                                   │ NO
                 ▼                                       ▼
    [Short-Circuit Cache]                   [Forward with Header]
    Return stored output_payload            Pass `Idempotency-Key: {key}`
    without calling backend                 to BackendAdminClient
```

* **AI Service Layer**: Guarantees that if a step was already executed and recorded, the tool will **not** be called again upon recovery.
* **Backend Admin Client**: Passes `Idempotency-Key` HTTP header on all mutating REST requests.
* **Core Backend Layer**: Enforces transactional deduplication via Redis or MySQL unique locks on the `Idempotency-Key`.

---

## 28. Context Separation: `AgentContext` vs. `ToolExecutionContext`

```
┌───────────────────────────────────────────────────────────┐
│                       AgentContext                        │
│ Scope: Entire Agent Request (Global)                      │
│ Lifecycle: Created at API layer, alive until HTTP response│
├───────────────────────────────────────────────────────────┤
│ - tenantId: String                                        │
│ - userId: String                                          │
│ - userRoles: Set<String>                                  │
│ - userToken: String (JWT)                                 │
│ - conversationId: UUID                                    │
│ - requestId: String (Trace ID)                            │
│ - channel: ChannelType (WEB, MOBILE, EVENT)               │
└─────────────────────────────┬─────────────────────────────┘
                              │
                              │ derives per step
                              ▼
┌───────────────────────────────────────────────────────────┐
│                   ToolExecutionContext                    │
│ Scope: Single Tool Execution (Local & Step-Specific)      │
│ Lifecycle: Created immediately prior to AiTool.execute()  │
├───────────────────────────────────────────────────────────┤
│ - tenantId: String (Enforced verified)                    │
│ - userId: String (Acting user)                            │
│ - userToken: String (Relayed bearer token)                │
│ - executionId: UUID (Parent execution)                    │
│ - stepNumber: int (Current iteration)                     │
│ - idempotencyKey: String (Deterministic per step)         │
│ - isApprovalGranted: boolean                              │
└───────────────────────────────────────────────────────────┘
```

---

## 29. Comprehensive ToolResult Model

```java
public record ToolResult(
    String toolName,
    ToolStatus status,               // SUCCESS, FAILURE, PARTIAL_SUCCESS, REQUIRES_APPROVAL
    Map<String, Object> data,         // Structured domain output
    String summaryText,              // LLM-readable natural language summary
    String errorCode,                // e.g., "TENANT_NOT_FOUND", "BACKEND_TIMEOUT"
    String errorMessage,             // Detailed diagnostic error
    boolean isRetryable,             // Hint to ExecutionEngine
    Map<String, Object> metadata     // Timing, backend reference IDs
) {}
```

* **Conversion for LLM Reasoning**:
  * `data` is serialized into clean, minimal JSON (omitting internal DB columns).
  * `summaryText` provides immediate semantic framing (e.g., *"Found 3 residents with overdue rent totaling $1,450.00."*).
  * If `status == REQUIRES_APPROVAL`, tool output tells the LLM: *"Action requires landlord approval. Proposed action has been saved for review."*

---

## 30. Failure Handling Matrix & V1 Guardrails

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Failure Handling Matrix                         │
├──────────────────────────┬─────────────────────────────┬───────────────┤
│ Failure Scenario         │ Action in V1                │ Future (V2+)  │
├──────────────────────────┼─────────────────────────────┼───────────────┤
│ A. LLM Provider Outage   │ Exponential backoff (max 3) │ Fallback model│
│ B. Invalid JSON Output   │ Prompt correction injection │ Output schema │
│ C. Tool Does Not Exist   │ Feed error back to LLM      │ Tool synonym  │
│ D. Invalid Tool Input    │ Bean validation error to LLM│ Few-shot repair│
│ E. Authorization Failure │ Stop step; return Denied    │ Auto-escalate │
│ F. Backend 500 Error     │ 1 retry if idempotent       │ Dead-letter   │
│ G. Backend 504 Timeout   │ Check idempotency status    │ Async poll    │
│ H. Partial Tool Success  │ Record partial; ask LLM     │ Saga rollback │
│ I. Max Steps Exceeded    │ Halt; return MAX_STEPS error│ User checkpoint│
│ J. Infinite Reasoning    │ Loop Detector stops flow    │ Semantic prune│
└──────────────────────────┴─────────────────────────────┴───────────────┘
```

* **V1 Hard Limits**:
  * Max Steps per Execution: Default **8 steps** (hard cap: 15).
  * Hard Timeout: **90 seconds**.
  * Max Consecutive Tool Failures: **3 times**.

---

## 31. Human-in-the-Loop Approval Architecture

```
                    ┌────────────────────────────┐
                    │      LLM Decision Point    │
                    └─────────────┬──────────────┘
                                  │ emits tool call
                                  ▼
                    ┌────────────────────────────┐
                    │    PolicyEnforcer Check    │
                    └─────────────┬──────────────┘
                                  │ requiresHumanApproval == true?
                                  │
                  ┌───────────────┴───────────────┐
                  │ YES                           │ NO
                  ▼                               ▼
    ┌───────────────────────────┐   ┌───────────────────────────┐
    │ 1. Create ApprovalRequest │   │ Execute tool immediately  │
    │ 2. Set Execution Status:  │   └───────────────────────────┘
    │    WAITING_FOR_APPROVAL   │
    │ 3. Dispatch Notification  │
    │ 4. Halt execution loop    │
    └─────────────┬─────────────┘
                  │
                  ▼ [Landlord Reviews Action in App]
    ┌───────────────────────────┐
    │ POST /executions/approve  │
    └─────────────┬─────────────┘
                  │
                  ▼
    ┌───────────────────────────┐
    │ ExecutionEngine.resume()  │
    │ Executes with approval    │
    └───────────────────────────┘
```

* **Ownership**: Managed by `ApprovalService` in `com.livic.ai.security.approval`. `AgentRuntime` consults `ApprovalService` before executing any write/destructive step.
* **`ApprovalRequest` Entity**: Contains `approvalId`, `executionId`, `tenantId`, `actionDescription`, `targetTool`, `payloadPreviewJson`, `status` (`PENDING`, `APPROVED`, `REJECTED`), `approvedBy`, `approvedAt`.

---

## 32. Tool Capability Classification

Every `ToolDefinition` declares its operational nature via `ToolCapability`:

```
                           ToolCapability
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
      [READ]                  [WRITE]              [DESTRUCTIVE]
   Idempotent              State Mutating         Data Deletion /
   Safe to execute         Creates entities       Irreversible action
   Auto-approved           Policy-checked         Always requires approval
   Ex: get_issues          Ex: create_ticket      Ex: terminate_lease
                                 │
                                 ▼
                     [EXTERNAL_SIDE_EFFECT]
                     Sends SMS / Email / External Webhooks
                     Always requires approval for bulk targets
                     Ex: send_payment_reminders
```

---

## 33. Loop Protection & Hallucination Defense

1. **Step Counter**: Incremented on every turn. Hard limit: `AgentDefinition.maxSteps()` (Default: 8).
2. **Identical Call Fingerprinting**:
   * Tracks digest of `MD5(toolName + inputJson)`.
   * Calling the identical tool twice consecutively injects a system warning into context.
   * Calling it three times forcibly aborts with `FAILED (LOOP_DETECTED)`.
3. **Cumulative Token Budget**: Execution terminates if total tokens across turns exceed 25,000 tokens.

---

## 34. Concurrency & Batching: The LLM is NOT a Job Scheduler

> **Anti-Pattern**: Prompting the LLM to call `sendReminder(residentId)` 5,000 times in a loop.

```
[WRONG]  LLM Loops:
         LLM ──► send_reminder(id=1) ──► LLM ──► send_reminder(id=2) ... (x5000)

[RIGHT]  Bulk Capability Tool:
         Step 1 (Read):  LLM calls `get_overdue_accounts()` ──► Returns List of 5,000 IDs
         Step 2 (Plan):  LLM calls `prepare_bulk_reminder(filterCriteria, messageTemplate)`
         Step 3 (Approve): Landlord approves bulk dispatch for 5,000 residents
         Step 4 (Exec):  AiTool dispatches a single asynchronous batch job to backend:
                         `POST /api/v1/notifications/bulk-jobs`
                         Backend processes batch via RabbitMQ / Spring Batch
```

* **Rule**: Tools expose bulk operations for set-based domains. The LLM specifies *intent and filter criteria*; the backend handles high-volume concurrency.

---

## 35. Synchronous vs. Asynchronous Execution Models

```
┌────────────────────────────────────────────────────────────────────────┐
│               Synchronous vs. Asynchronous Decision Model              │
├───────────────────────────────────┬────────────────────────────────────┤
│       SYNCHRONOUS EXECUTION       │         ASYNCHRONOUS JOB           │
├───────────────────────────────────┼────────────────────────────────────┤
│ - Simple Q&A ("What is pet policy")│ - Multi-step workflows (> 2 steps) │
│ - Single read tool ("Show tickets")│ - Side-effect operations (Writes)  │
│ - Client holds HTTP connection    │ - Bulk communications (Reminders)  │
│ - Response within 2–5 seconds     │ - Workflows needing human approval │
│ - Direct REST 200 OK response     │ - Returns 202 Accepted with jobId  │
└───────────────────────────────────┴────────────────────────────────────┘
```

* **Evolution of Existing Prototype**:
  * `AIJobTbl` evolves into `ai_execution_tbl` (`AgentExecution`).
  * `AIJobCreatedEvent` evolves into `AgentExecutionStartedEvent` and `AgentExecutionResumeEvent`.
  * `AIJobEventListener` evolves into a dedicated `ExecutionQueueConsumer`.

---

## 36. Event-Driven Agents

```
                        Livic Backend Event
                     (e.g., PaymentOverdueEvent)
                                 │
                                 ▼ [RabbitMQ / Spring Cloud Stream]
                   ┌───────────────────────────┐
                   │    DomainEventListener    │
                   └─────────────┬─────────────┘
                                 │
                     1. Verifies feature enabled for tenant
                     2. Creates `AgentExecution` (status=CREATED)
                                 │
                                 ▼
                   ┌───────────────────────────┐
                   │ AgentExecutionRepository  │
                   └─────────────┬─────────────┘
                                 │
                     3. Publishes `AgentExecutionStartedEvent`
                                 │
                                 ▼
                   ┌───────────────────────────┐
                   │       AgentRuntime        │
                   │ (Picks up asynchronously) │
                   └───────────────────────────┘
```

* **Rule**: Events never invoke `AgentRuntime` directly in the listener thread. They persist an `AgentExecution` record first, guaranteeing fault-tolerant recovery if nodes crash during startup.

---

## 37. Complete End-to-End Walkthrough: Overdue Reminder Flow

**Prompt:** *"Find all overdue maintenance charges for my property and send a reminder to the residents."*

```
Step 1: Ingestion & Router
- HTTP POST /api/v1/ai/jobs received with user JWT.
- Controller creates AgentContext(tenantId="t-100", userId="u-200").
- AgentRouter selects BillingAgent.

Step 2: Execution Initialization
- AgentRuntime creates AgentExecution(id="exec-501", status=RUNNING).
- Returns HTTP 202 Accepted {"executionId": "exec-501", "status": "RUNNING"}.

Step 3: Cycle 1 (Fact Discovery)
- LLM receives prompt + tools.
- LLM outputs ToolCall: `billing_get_overdue_charges(propertyId=null)`.
- PolicyEnforcer verifies `BILLING_READ` -> APPROVED.
- Tool executes -> Backend returns 2 delinquent tenants ($150 and $300).
- ToolResult saved into ToolExecutionRecord(step=1, status=SUCCESS).
- AgentExecution.currentStep updated to 1.

Step 4: Cycle 2 (Action Formulation)
- LLM observes delinquent tenant list.
- LLM outputs ToolCall: `billing_send_payment_reminder(tenantIds=["u-10", "u-20"], amount=[150, 300])`.
- ToolDefinition flags `requiresHumanApproval = true` and capability = `EXTERNAL_SIDE_EFFECT`.

Step 5: Approval Suspension
- Runtime intercepts call before execution.
- Runtime creates ApprovalRequest(id="appr-88", action="Send overdue payment reminders to Flat 101 ($150) and Flat 204 ($300)").
- ToolExecutionRecord(step=2, status=PENDING_APPROVAL).
- AgentExecution transitions to WAITING_FOR_APPROVAL.
- WebSocket / Push notification sent to Landlord: "Approval Required: Send payment reminders".

Step 6: Human Decision
- Landlord opens app, inspects details, taps "Confirm & Send".
- Landlord FE calls: `POST /api/v1/ai/executions/exec-501/approve`.

Step 7: Resumption & Idempotent Execution
- ExecutionEngine loads exec-501 and step=2.
- ToolExecutionContext injected with `isApprovalGranted = true` and `idempotencyKey = "exec-501-step-2"`.
- `AiTool: BillingTool` executes via `BackendAdminClient` with `Idempotency-Key` header.
- Backend dispatches notifications, returns batch reference `"batch-9901"`.
- ToolExecutionRecord(step=2) updated to SUCCESS.

Step 8: Cycle 3 (Final Synthesis)
- Result fed back to LLM.
- LLM outputs text: "Overdue reminders have been successfully sent to Flat 101 ($150) and Flat 204 ($300). Reference: batch-9901."
- AgentExecution transitions to COMPLETED.
```

---

## 38. Complete Execution Sequence Diagram

```
User/Event       AIController     AgentRuntime    ExecutionEngine   PolicyEnforcer     AiTool       Backend API
    │                  │               │                 │                 │              │              │
    ├─ POST /jobs ─────►               │                 │                 │              │              │
    │                  ├─ create() ────►                 │                 │              │              │
    │                  │  (AgentExec)  ├─ dispatch() ────►                 │              │              │
    │◄─ 202 Accepted ──┤               │                 ├─ call LLM       │              │              │
    │   (jobId)        │               │                 │  (Tool Request) │              │              │
    │                  │               │                 ├─ authorize() ───►              │              │
    │                  │               │                 │◄─ OK ───────────┤              │              │
    │                  │               │                 │                                │              │
    │                  │               │                 ├─ [Destructive / Write?]        │              │
    │                  │               │                 │  YES ──► Suspend Execution     │              │
    │                  │               │                 │          Set WAITING_APPROVAL  │              │
    │                  │               │                 │                                │              │
    │◄─ Push: Approval Needed ─────────┤                 │                                │              │
    │                  │               │                 │                                │              │
    ├─ POST /approve ──►               │                 │                                │              │
    │                  ├─ resume() ────►                 │                                │              │
    │                  │               ├─ executeStep() ─►                                │              │
    │                  │               │                 ├─ check idempotency             │              │
    │                  │               │                 ├─ execute(ctx, input) ──────────►              │
    │                  │               │                 │                                ├── HTTP Req ──►
    │                  │               │                 │                                │◄── 200 OK ───┤
    │                  │               │                 │◄─ ToolResult ──────────────────┤              │
    │                  │               │                 │                                               │
    │                  │               │                 ├─ record step in DB                            │
    │                  │               │                 ├─ LLM final response                           │
    │                  │               │                 ├─ mark COMPLETED                               │
    │                  │               │◄─ Finished ─────┤                                               │
```

---

# PART IV: Tool System & Backend Integration

## 39. What Exactly is an `AiTool`?

In the Livic architecture, an **`AiTool` is an Executable Capability Adapter (Option A + D)**.

It is **not** a Spring AI wrapper, nor is it a business domain service.

```
┌────────────────────────────────────────────────────────────────────────┐
│                                AiTool                                  │
│                   (Executable Capability Adapter)                      │
│                                                                        │
│  Translates a validated, authorized AI tool invocation into a strongly-│
│  typed call against the Livic Core Backend client.                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Livic Core Backend API                          │
│               (Sole Source of Truth for Business Rules)                │
└────────────────────────────────────────────────────────────────────────┘
```

### What `AiTool` Knows vs. What It Must NOT Know

| What `AiTool` Knows | What `AiTool` Must NOT Know |
|---|---|
| Its own static `ToolDefinition` (name, schema, capabilities). | LLM provider details, model names, or prompt templates. |
| Its strongly-typed Java Input DTO (e.g., `CreateIssueInput`). | Spring AI annotations or framework internals (`@Tool`, `ChatClient`). |
| How to invoke the backend client (`BackendAdminClient`). | Conversation history or previous step outputs. |
| How to project raw backend responses into a lean `ToolResult`. | Session state, HTTP session tokens, or raw thread-locals. |
| The authenticated context passed via `ToolExecutionContext`. | Direct database access, JPA repositories, or entity tables. |

---

## 40. ToolDefinition: Metadata Specification

`ToolDefinition` is an immutable specification record used across five subsystems:
1. **LLM Tool Calling**: Formats OpenAPI/JSON Schema function specifications.
2. **Authorization**: Evaluates role scopes and tenant entitlement.
3. **Observability**: Tags metrics, audit logs, and OpenTelemetry spans.
4. **Model Context Protocol (MCP)**: Exposes tool manifests over JSON-RPC.
5. **Testing**: Drives automated contract testing and mocks.

```java
public record ToolDefinition(
    String name,                           // e.g., "issue_create_ticket"
    String description,                    // Natural language guidance for LLM
    Class<?> inputType,                    // DTO class for reflection-based JSON schema
    ToolCapability capability,             // READ, WRITE, DESTRUCTIVE, EXTERNAL_SIDE_EFFECT
    ToolRiskLevel riskLevel,               // LOW, MEDIUM, HIGH, CRITICAL
    Set<String> requiredPermissions,       // e.g., Set.of("ISSUE_CREATE")
    boolean isIdempotent,                  // Can this tool be safely retried on network failure?
    Duration timeout,                      // Default execution timeout (e.g., 5s)
    boolean requiresHumanApproval,         // Mandates execution pause for human confirmation
    String version                         // e.g., "1.0.0"
) {}
```

* **Why omit output schema from runtime?** The LLM does not consume output schemas during prompt compilation; it only needs an input schema. Output schemas are managed via testing/documentation to minimize token overhead.

---

## 41. ToolRegistry: Discovery, Scoping & Governance

```
                    Spring ApplicationContext
                               │
                               │ scans on startup
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        ToolRegistry                         │
│ - In-memory catalog of all registered `AiTool` beans        │
│ - Indexed by tool name and capability                       │
│ - Dynamic kill-switch toggle per tenant or globally         │
└──────────────────────────────┬──────────────────────────────┘
                               │
        filters available tools per agent invocation
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Filtered Tool Slice                      │
│ 1. AgentDefinition.allowedToolNames()                       │
│ 2. Tenant Subscription Feature Entitlements                │
│ 3. User JWT Role & Permission Matrix                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Lifecycle Rules:
1. **Bean Discovery**: `AiTool` implementations are standard Spring beans (`@Component`). On bootstrap, `ToolRegistry` discovers all `AiTool` beans via dependency injection (`List<AiTool>`).
2. **Per-Agent Scoping**: No agent has access to all tools. `AgentDefinition.allowedToolNames()` explicitly declares the subset of tools the agent archetype is allowed to consider (e.g., `MaintenanceAgent` only receives `issue_*` and `property_get` tools).
3. **Dynamic Enable/Disable**: Tools can be toggled off at runtime via Spring Cloud Config / Redis feature flags (e.g., disable `send_notification` during an SMS gateway outage).
4. **Versioning**: Multiple versions (e.g., `issue_create_ticket:v1` and `issue_create_ticket:v2`) can coexist in the registry under unique names.

---

## 42. Tool Categories & Risk Levels

We decouple **Operational Capability Type** (what the tool does mechanically) from **Risk Level** (the potential business or financial impact).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Operational Capability                          │
├───────────────────────┬────────────────────────────────────────────────┤
│ READ                  │ Side-effect free; safe to retry and cache.     │
│ WRITE                 │ Creates/updates internal entities.             │
│ DESTRUCTIVE           │ Deletes or deactivates critical business data. │
│ EXTERNAL_SIDE_EFFECT  │ Emits emails, SMS, webhooks, or payments.      │
└───────────────────────┴────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                               Risk Level                               │
├───────────────────────┬────────────────────────────────────────────────┤
│ LOW                   │ Fetching public property address, FAQs.        │
│ MEDIUM                │ Creating maintenance ticket, updating a bio.   │
│ HIGH                  │ Creating leases, dispatching building notices. │
│ CRITICAL              │ Deleting properties, triggering bulk payments. │
└───────────────────────┴────────────────────────────────────────────────┘
```

### The Crucial Distinction:
* **Capability Type** determines **infrastructure mechanics** (whether it requires idempotency keys, whether it can be retried automatically, whether it can be cached).
* **Risk Level** determines **security and governance** (whether it mandates multi-factor authentication, human-in-the-loop approval, or manager-only access).

---

## 43. Tool Input Validation Pipeline

The LLM is treated as an **untrusted remote client**. Any argument generated by the model must pass a rigorous multi-stage validation pipeline before executing business logic.

```
                      LLM Emits JSON Arguments
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Stage 1: Syntax & Structural Validation                         │
│ - Handled by: SpringAiToolAdapter / Jackson                     │
│ - Verifies valid JSON syntax and deserialization into Java DTO. │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Stage 2: Declarative Constraints (Jakarta Validation)           │
│ - Handled by: `Validator.validate(dto)`                         │
│ - Checks `@NotNull`, `@Size`, `@Pattern`, `@Min`, `@Max`.       │
│ - Failure immediately returns `ToolResult.failure(...)` to LLM. │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Stage 3: Authorization & Tenant Boundary Check                  │
│ - Handled by: `PolicyEnforcer`                                  │
│ - Verifies caller role possesses tool's `requiredPermissions`.  │
│ - Ensures `tenantId` is stamped from verified `AgentContext`.   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Stage 4: Business Invariant Validation                          │
│ - Handled by: Livic Core Backend API                            │
│ - Validates that referenced UUIDs belong to the verified tenant,│
│   property units exist, leases are active, etc.                 │
└─────────────────────────────────────────────────────────────────┘
```

> **Zero-Trust Rule**: The LLM is **never** permitted to supply a `tenantId`. Even if the model generates a `propertyId`, the backend validates that the property belongs to the caller’s verified `tenantId`.

---

## 44. Multi-Tenant Isolation Architecture

```
User (Mobile / Web) ──[Authenticated Bearer JWT]──► AI Controller
                                                          │
                                         Extracts verified tenantId from JWT
                                                          │
                                                          ▼
                                                     AgentContext
                                                          │
                                                          ▼
                                                  ToolExecutionContext
                                                          │
                                  Injected into BackendAdminClient headers
                                                          │
                                                          ▼
                                 HTTP Header: `X-Tenant-ID: {verifiedTenantId}`
                                 HTTP Header: `Authorization: Bearer {jwt}`
                                                          │
                                                          ▼
                                                  Livic Core Backend
                                        (Validates SQL / Tenant Schema Filter)
```

1. **Origin of `tenantId`**: Extracted strictly from the authenticated Spring Security `UserDetailsImpl` / JWT claims at the HTTP gateway.
2. **Never an LLM Parameter**: `tenantId` is omitted from all `ToolDefinition` input schemas. The model cannot hallucinate or tamper with tenancy.
3. **Backend Enforcement**: The core backend verifies that the caller's JWT has membership in the requested `propertyId` via its own `@PreAuthorize("@authorizationService.hasPermission(...)")`.

---

## 45. The Authorization Pipeline: `AiAuthorization`

When an LLM requests an action (e.g., `property_delete(propertyId=123)`), authorization occurs in a defense-in-depth hierarchy:

```
Tool Invocation Requested
  │
  ├─► 1. Check Tool Capability Toggle: Is the tool globally or tenant-enabled?
  │
  ├─► 2. Check Agent Scope: Is this tool in `AgentDefinition.allowedToolNames()`?
  │
  ├─► 3. Check User RBAC: Does the user’s JWT role have the required permission (e.g., `PROPERTY_EDIT`)?
  │
  ├─► 4. Check Approval Gate: Does `ToolDefinition.requiresHumanApproval()` mandate a human pause?
  │
  ├─► 5. Check Resource Ownership: Backend validates `propertyId=123` belongs to caller's tenant.
  │
  └─► Execution Dispatched
```

---

## 46. Tool → Backend Communication: Gateway Abstraction

### Evaluated Alternatives:
* **Option A: Tools directly call backend REST endpoints via WebClient**: Spreads HTTP plumbing, deserialization, and token relay logic into every tool. (Anti-pattern).
* **Option B: Tools call a single monolithic `BackendAdminClient`**: Leads to an unmaintainable god-class as endpoints expand.
* **Option C: Modular Domain Backend Clients (RECOMMENDED)**:
  * Tools inject domain-specific clients backed by an underlying transport gateway:
    * `BackendPropertyClient`
    * `BackendIssueClient`
    * `BackendBillingClient`
    * `BackendNotificationClient`

```
┌────────────────────────────────────────────────────────┐
│                        AiTool                          │
│               (e.g., CreateIssueTool)                  │
└───────────────────────────┬────────────────────────────┘
                            │ typed method call
                            ▼
┌────────────────────────────────────────────────────────┐
│                 BackendIssueClient                     │
│            (Domain-specific REST Client)               │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             BackendTransportGateway                    │
│ - Injects Bearer JWT & X-Tenant-ID headers             │
│ - Attaches Idempotency-Key headers                     │
│ - Standardizes error mapping (404 -> NotFound, etc.)   │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP REST
                            ▼
               Livic Core Backend Services
```

---

## 47. Business Logic Boundary

> **Architectural Rule:** The AI service orchestrates capabilities; the backend enforces business invariants.

```
┌────────────────────────────────────────────────────────────────────────┐
│                           AI SERVICE / TOOL                            │
├────────────────────────────────────────────────────────────────────────┤
│ • Validates input format (non-empty strings, valid UUID syntax).       │
│ • Validates user role matches tool requirements.                       │
│ • Serializes arguments into backend REST request.                      │
│ • Sanitizes backend output for LLM context.                            │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP
┌────────────────────────────────────────────────────────────────────────┐
│                          LIVIC CORE BACKEND                            │
├────────────────────────────────────────────────────────────────────────┤
│ • Enforces property existence and tenant ownership.                    │
│ • Verifies user tenancy status (resident active in unit).              │
│ • Enforces business duplicate rules (ticket already open for pipe?).   │
│ • Manages database transactions and ACID commits.                      │
│ • Publishes domain events (e.g., IssueCreatedEvent -> WebSocket/SMS).  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 48. ToolResult: Design & Context Sanitization

The LLM must **never** receive raw backend database DTOs. A backend endpoint may return 100 internal columns (audit flags, password hashes, foreign keys, internal status enums). Passing this raw payload pollutes context windows and creates security risks.

```
┌─────────────────────────────────────────────────────────────┐
│                       Raw Backend DTO                       │
│ 100+ fields: { id, version, tenant_id, raw_sql_state... }   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                  Tool projects & sanitizes
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         ToolResult                          │
│                                                             │
│ 1. data: Lean JSON map containing ONLY fields needed        │
│    for reasoning (e.g., { ticketId, status, unitNumber }).  │
│ 2. summaryText: Natural language synopsis for LLM:          │
│    "Maintenance ticket #1042 created for Unit 204."        │
│ 3. status: SUCCESS / FAILURE / REQUIRES_APPROVAL            │
│ 4. isRetryable: boolean                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 49. Tool Output Size: Avoiding LLM Database Querying

> **Anti-Pattern:** Returning 50,000 residents to the LLM and instructing it to "filter who hasn't paid rent."

### Architectural Guardrails:
1. **Server-Side Aggregation & Filtering**: Tools must expose specialized backend query endpoints (e.g., `analytics_get_defaulters` instead of `resident_get_all`).
2. **Hard Pagination Limits**: All list tools enforce a default of 20 items, with a hard maximum of 50 items per turn.
3. **Structured Truncation Summaries**: If a result exceeds limits, the tool returns:
   ```json
   {
     "totalCount": 142,
     "displayedCount": 20,
     "hasMore": true,
     "items": [ ... ],
     "summary": "142 total overdue residents found. Showing top 20 by highest debt."
   }
   ```

---

## 50. Tool Composition: The Orchestration Rule

> **Can Tools Call Other Tools?**
> **STRICT ARCHITECTURAL RULE: NO.** Tools must never invoke other tools directly.

```
[FORBIDDEN]  Tool A ──► Tool B ──► Tool C
             (Creates hidden coupling, untraceable side-effects, and breaks authorization)

[CORRECT]    AgentRuntime / ExecutionEngine
                    ├──► Step 1: Execute Tool A
                    ├──► Step 2: Observe Result
                    ├──► Step 3: Execute Tool B
                    └──► Step 4: Execute Tool C
```

* **Rationale**: If Tool A calls Tool B internally, `AgentRuntime` loses step-level observability, `PolicyEnforcer` cannot evaluate permissions for Tool B, idempotency breaks, and the LLM cannot reason over intermediate steps.

---

## 51. Tool Versioning Strategy

Tools evolve alongside backend APIs. We enforce explicit contract versioning:

1. **Additive Changes**: Adding optional parameters to a tool DTO does not change the tool version.
2. **Breaking Changes**: Changing argument types or removing fields requires a new tool name or explicit version tag (e.g., `issue_create_v2`).
3. **Backward Compatibility for Audits**: Replaying historic executions from `ai_tool_execution_record_tbl` always uses the version recorded at the time of execution.

---

## 52. Multi-Layer Idempotency Architecture

```
                    ┌───────────────────────────────┐
                    │      Layer 1: AI Runtime      │
                    │ Checks ToolExecutionRecord for│
                    │ key before calling tool.      │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  Layer 2: Transport Gateway   │
                    │ Injects HTTP header:          │
                    │ `Idempotency-Key: {key}`      │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   Layer 3: Backend Database   │
                    │ Redis / MySQL unique lock on  │
                    │ Idempotency-Key guarantees no │
                    │ duplicate entity or message.  │
                    └───────────────────────────────┘
```

* **Idempotency Key Derivation**:
  `IdempotencyKey = SHA256(executionId + ":" + stepNumber + ":" + toolName + ":" + hash(inputPayload))`

---

## 53. Deterministic Retry Classification

The LLM is **forbidden** from deciding whether an error is retryable. Retry policies are hardcoded into infrastructure adapters:

```
┌────────────────────────────────────────────────────────────────────────┐
│                       Error Retry Classification                       │
├────────────────────────────┬─────────────┬─────────────────────────────┤
│ Error Type                 │ Retryable?  │ Action Taken                │
├────────────────────────────┼─────────────┼─────────────────────────────┤
│ Validation / Constraint    │ NO          │ Return failure to LLM       │
│ Unauthorized / Forbidden   │ NO          │ Forcibly halt step          │
│ Not Found (404)            │ NO          │ Feed observation to LLM     │
│ Business Rule Violation    │ NO          │ Feed message to LLM         │
│ HTTP 429 (Rate Limit)      │ YES         │ Backoff according to header │
│ HTTP 500 (Internal Error)  │ YES (1 max) │ Retry only if idempotent    │
│ HTTP 504 / Network Timeout │ YES (1 max) │ Check status via key first  │
└────────────────────────────┴─────────────┴─────────────────────────────┘
```

---

## 54. Human Approval Binding

Approval is **cryptographically and statefully bound** to the exact proposed parameters.

```
1. LLM proposes tool call:
   Tool: "property_delete"
   Payload: { "propertyId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" }

2. PolicyEnforcer checks `ToolDefinition.requiresHumanApproval()` -> TRUE.

3. Engine computes action digest:
   ActionHash = SHA256(toolName + canonicalJson(payload))

4. ApprovalRequest created in DB:
   {
     "approvalId": "appr-101",
     "executionId": "exec-501",
     "actionHash": "e3b0c44298fc1c149afbf4c8996fb924...",
     "status": "PENDING"
   }

5. When Landlord approves:
   POST /api/v1/ai/executions/exec-501/approve?approvalId=appr-101

6. Engine verifies:
   Current ActionHash == ApprovalRequest.actionHash
   If parameters were tampered with or modified by prompt injection, execution is REJECTED.
```

---

## 55. Model Context Protocol (MCP) Future Compatibility

Our pure domain `AiTool` and `ToolDefinition` abstractions make MCP support seamless without refactoring business tools:

```
                     ┌────────────────────────────────────────┐
                     │            Domain `AiTool`             │
                     │  - execute(ToolExecutionContext, input)│
                     │  - getDefinition()                     │
                     └───────┬────────────────────────┬───────┘
                             │                        │
               ┌─────────────┴────────┐      ┌────────┴─────────────┐
               ▼                      ▼      ▼                      ▼
      SpringAiToolAdapter       McpToolAdapter           CLI / Testing
      (Internal Agent Loop)     (Exposes JSON-RPC        (Direct Unit Tests)
                                 over SSE/stdio)
```

* **What MCP Handles**: JSON-RPC serialization, schema discovery (`tools/list`), execution dispatch (`tools/call`).
* **What MCP Must NOT Handle**: Business validation, database querying, or tenant authorization (which remain strictly inside `AiTool` and the core backend).

---

## 56. Security Threat Modeling & Mitigations

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Security Threat Matrix                          │
├──────────────────────────┬─────────────────────────────────────────────┤
│ Threat Vector            │ Architectural Defense                       │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 1. Prompt Injection      │ Tools ignore instructions embedded in data. │
│                          │ Parameter schemas reject free-form commands.│
├──────────────────────────┼─────────────────────────────────────────────┤
│ 2. Tool Abuse / Spam     │ Rate-limiting per user/tenant. Cumulative   │
│                          │ execution budgets (max 8 steps/turn).       │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 3. Data Exfiltration     │ Tools project lean DTOs; never return full  │
│                          │ DB tables or internal audit fields.         │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 4. Cross-Tenant Access   │ `tenantId` is forced via verified context   │
│                          │ and validated at SQL level by backend.      │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 5. Privilege Escalation  │ Backend `@PreAuthorize` verifies user role  │
│                          │ against resource ownership on every call.   │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 6. Tool Output Injection │ Tool results are escaped and tagged as data │
│                          │ observations, never executed as directives. │
└──────────────────────────┴─────────────────────────────────────────────┘
```

---

## 57. Observability & Audit Tracing

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Tool Observability Split                        │
├────────────────────────────────────┬───────────────────────────────────┤
│    Persistent Audit (Compliance)   │   Operational Metrics (Metrics)   │
├────────────────────────────────────┼───────────────────────────────────┤
│ Table: `ai_tool_execution_record`  │ Prometheus / Micrometer / OTel    │
│ - executionId                      │ - Timer: tool_execution_time_ms   │
│ - stepNumber                       │ - Counter: tool_calls_total       │
│ - toolName & version               │ - Counter: tool_errors_total      │
│ - tenantId & userId                │ - Counter: tool_retries_total     │
│ - inputPayload (PII-masked)        │ - Gauge: active_tool_calls        │
│ - outputPayload (sanitized)        │ - Trace Span: `AiTool:{name}`     │
│ - status, durationMs, errorCode    │                                   │
└────────────────────────────────────┴───────────────────────────────────┘
```

* **PII Masking**: Credit card numbers, passwords, and sensitive government IDs are masked by the transport gateway before persisting to `ai_tool_execution_record_tbl`.

---

## 58. Initial Livic Tool Set (Mapped to Existing Backend)

Based on inspecting the actual Livic backend modules (`issue`, `property`, `analytics`, `announcement`, `finance`), here is the verified initial tool set:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                Initial Livic Tool Catalog                               │
├──────────────────────────┬───────┬──────────┬──────────┬────────────────────────────────┤
│ Tool Name                │ Type  │ Risk     │ Approval │ Backend Endpoint Mapped        │
├──────────────────────────┼───────┼──────────┼──────────┼────────────────────────────────┤
│ property_list_my         │ READ  │ LOW      │ No       │ GET /api/v1/properties         │
│ property_get_by_id       │ READ  │ LOW      │ No       │ GET /api/v1/properties/{id}    │
│ issue_list               │ READ  │ LOW      │ No       │ GET /api/v1/issues             │
│ issue_get_by_id          │ READ  │ LOW      │ No       │ GET /api/v1/issues/{id}        │
│ analytics_get_summary    │ READ  │ LOW      │ No       │ GET /api/v1/analytics/summary  │
│ analytics_get_defaulters │ READ  │ MEDIUM   │ No       │ GET /api/v1/analytics/defaulter│
│ announcement_list        │ READ  │ LOW      │ No       │ GET /api/v1/announcement/...   │
│ issue_create             │ WRITE │ MEDIUM   │ No       │ POST /api/v1/issues            │
│ issue_add_comment        │ WRITE │ LOW      │ No       │ POST /api/v1/issues/{id}/comm..│
│ announcement_create      │ WRITE │ MEDIUM   │ Yes      │ POST /api/v1/announcement/...  │
│ issue_escalate           │ WRITE │ MEDIUM   │ No       │ POST /api/v1/issues/{id}/escal.│
│ property_create          │ WRITE │ HIGH     │ Yes      │ POST /api/v1/properties        │
│ property_delete          │ DESTR │ CRITICAL │ Yes      │ DELETE /api/v1/properties/{id} │
│ billing_send_reminders   │ EXT   │ HIGH     │ Yes      │ POST /api/v1/notifications/rem.│
└──────────────────────────┴───────┴──────────┴──────────┴────────────────────────────────┘
```

---

## 59. Complete End-to-End Workflow Traces

### Example 1: Pure Read Query
**User:** *"Show me all maintenance issues for my property."*
* **LLM Tool Call:** `issue_list(page=0, size=20)`.
* **Validation:** Syntactic check on pagination params (valid).
* **Authorization:** Role has `ISSUE_VIEW` (granted).
* **Approval:** `ToolCapability.READ` -> No approval required.
* **Execution:** `BackendIssueClient` invokes `GET /api/v1/issues`.
* **Result:** 3 open tickets returned -> Sanitized to ticket title, status, unit -> LLM summarizes for user.

### Example 2: Write Query (Autonomous Invariant Execution)
**User:** *"Create a maintenance request for the leaking pipe in apartment 204."*
* **LLM Tool Call:** `issue_create(unitId="u-204", title="Leaking pipe", category="PLUMBING")`.
* **Validation:** Jakarta validation passes (`@NotBlank title`).
* **Authorization:** Role has `ISSUE_CREATE` (granted).
* **Approval:** `ToolCapability.WRITE`, Risk = `MEDIUM` -> Configured for auto-execution without human confirmation.
* **Execution:** `BackendIssueClient` invokes `POST /api/v1/issues`.
* **Backend:** Verifies unit exists in caller's property, creates ticket, publishes event.
* **Result:** Returns `ticketId: "iss-99"`, LLM confirms: *"Ticket #iss-99 has been logged for Apartment 204."*

### Example 3: Side-Effect / Multi-Step Query (Approval Gate Required)
**User:** *"Send a reminder to every resident who has an overdue payment."*
* **Cycle 1 (Read):** LLM calls `analytics_get_defaulters()`.
  * Returns 2 delinquent accounts: Flat 101 ($150) and Flat 204 ($300).
* **Cycle 2 (Formulate Action):** LLM calls `billing_send_reminders(delinquentIds=["u-101", "u-204"])`.
  * Capability = `EXTERNAL_SIDE_EFFECT`, Risk = `HIGH`, `requiresHumanApproval = true`.
* **Approval Intercept:**
  * `PolicyEnforcer` halts execution before calling the tool.
  * Creates `ApprovalRequest` record with exact payload hash.
  * Execution status transitions to `WAITING_FOR_APPROVAL`.
* **Landlord Action:** Landlord reviews and confirms in mobile app.
* **Resumption:**
  * Engine resumes execution with `isApprovalGranted = true` and `Idempotency-Key: exec-501-step-2`.
  * Dispatches to backend notification queue.
  * Execution completes.

---

## 60. Complete Tool Execution Sequence Diagram

```
User/AgentRuntime      ToolRegistry     PolicyEnforcer     SpringAiAdapter       AiTool       BackendClient     Core Backend
        │                   │                 │                   │                 │               │                │
        ├─ getTools(agent) ─►                 │                   │                 │               │                │
        │◄─ Allowed Tools ──┤                 │                   │                 │               │                │
        │                                     │                   │                 │               │                │
        ├─ Invoke Tool Call ──────────────────┼───────────────────►                 │               │                │
        │                                     ├─ Validate DTO ────┤                 │               │                │
        │                                     ├─ Authorize RBAC ──┤                 │               │                │
        │                                     │                   │                 │               │                │
        │                                     ├─ [Needs Approval?]│                 │               │                │
        │                                     │   YES ──► Halt    │                 │               │                │
        │                                     │                   │                 │               │                │
        │                                     │   NO / Approved   │                 │               │                │
        │                                     │   Assemble Ctx ───►                 │               │                │
        │                                                         ├─ execute(ctx) ──►               │                │
        │                                                         │                 ├─ call(args) ──►                │
        │                                                         │                 │               ├── HTTP REST ───►
        │                                                         │                 │               │   (X-Tenant-ID)│
        │                                                         │                 │               │◄── 200 OK ─────┤
        │                                                         │                 │◄─ Backend DTO ┤                │
        │                                                         │                 │                                │
        │                                                         │                 ├─ Sanitize to ToolResult        │
        │                                                         │◄─ ToolResult ───┤                                │
        │◄─ Observation ──────────────────────────────────────────┤                                                  │
```

---

## ARCHITECTURE DECISIONS TO LOCK

### Core Domain & Spring AI Boundary Decisions
1. **Strict Decoupling from Spring AI in Domain Code**: Domain packages have zero imports from `org.springframework.ai.*`. Spring AI is strictly confined to adapter packages.
2. **`LlmGateway` as Sole Model Contact Point**: `AgentRuntime` interacts with LLMs exclusively through `LlmGateway`.
3. **Singleton `ChatClient.Builder` with Per-Request Mutation**: `ChatClient.Builder` is initialized once; invocations use `mutate()` to bind dynamic prompts and filtered tool callbacks.
4. **Zero Direct DB Access for Tools**: Tools interact with Livic business data exclusively through authenticated REST clients (`BackendAdminClient`) using relayed tokens and forced tenant headers.
5. **Two-Layer Tool Security**: Unauthorized tools are excluded from LLM prompts. `PolicyEnforcer` blocks hallucinated or unauthorized calls before invocation.
6. **Decoupled Relational Chat Memory**: Stored in `ai_conversation_message_tbl` and injected via `ModelRequest`.
7. **Mandatory Tenant Predicates in RAG**: All vector queries enforce `tenant_id == context.tenantId` at query construction time.
8. **MCP Readiness Without Tool Refactoring**: `AiTool` implementations are designed for direct exposure via MCP server adapters.

### Execution Engine Decisions
9. **Two-Tier Engine Split**: `AgentRuntime` coordinates workflow state and conversation memory; `ExecutionEngine` executes individual steps, enforces idempotency, and manages retries.
10. **Deterministic Idempotency Key**: Generated as `MD5(executionId + stepNumber + toolName + inputHash)` and passed to all downstream write operations.
11. **Database-Backed Resumption**: No in-memory state machines. State transitions are committed to `ai_execution_tbl` and `ai_tool_execution_record_tbl` after every step.
12. **Tool Capability Classification**: Every tool explicitly declares `READ`, `WRITE`, `DESTRUCTIVE`, or `EXTERNAL_SIDE_EFFECT`.
13. **Mandatory Approval for Side Effects**: Tools classified as `DESTRUCTIVE` or `EXTERNAL_SIDE_EFFECT` automatically suspend execution into `WAITING_FOR_APPROVAL`.
14. **No LLM Job Scheduling**: Set operations must use bulk backend APIs. The LLM is forbidden from acting as a sequential loop scheduler for mass entities.
15. **Unified Job Model Evolution**: Evolve the existing `AIJobTbl` and `AIJobEventListener` into the new `AgentExecution` and `ExecutionQueueConsumer` model.

### Tool System & Backend Integration Decisions
16. **`AiTool` is an Executable Capability Adapter**: Contains zero LLM or Spring AI imports; delegates business invariants to core backend services.
17. **Strict Context Injection for Tenancy**: `tenantId` is never an LLM tool parameter; injected strictly from verified security context.
18. **No Tool-to-Tool Invocation**: Tools never call other tools. All composition is driven sequentially by `AgentRuntime`.
19. **Context Sanitization by Default**: Tools project lean DTOs and concise summaries; raw 100-field backend entities are never returned to LLMs.
20. **Payload-Bound Human Approval**: Approvals are cryptographically hashed to the exact proposed parameters to prevent tampering or prompt injection drift.
21. **Domain-Scoped Backend Clients**: Tools inject focused clients (`BackendPropertyClient`, `BackendIssueClient`) rather than a single monolithic client.
22. **Infrastructure-Driven Retries**: Only network and 500/504 errors on idempotent tools can be retried; business and validation errors are never retried automatically.
23. **Dual-Use Tool Contracts**: `AiTool` and `ToolDefinition` must be designed to plug seamlessly into both internal Spring AI adapters and external MCP adapters without modification.



