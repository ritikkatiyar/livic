# Security, the backend client and the audit tables

## Login (`security/`, `config/SecurityConfig`)

ai-service doesn't log anyone in. It accepts the same JWT the backend issued to the app.

- **`JwtAuthenticationFilter`** reads `Authorization: Bearer <token>` and asks `JwtService` to verify
  it. If the token is valid:
  - the signed-in user is the token's `sub` (the user id);
  - the raw token is kept as the credentials, so tools can relay it;
  - every user gets `ROLE_USER`. Real permissions come from the backend (below).

  A bad or expired token is ignored, which leaves the request unauthenticated.
- **`JwtService`** checks the HS256 signature with `app.jwt.secret` (`APP_JWT_SECRET`). **This must be
  the same secret the backend signs with**, or every request is rejected.
- **`SecurityConfig`:**
  - stateless sessions, CSRF off (no cookies), CORS from `app.cors.*`;
  - public: `OPTIONS`, `/health` and `/actuator/**`; everything else needs a valid token;
  - a missing or bad token gets **401**, not 403, so the apps refresh the token and retry.

## Who can see what

Livic's JWT has no organisation or tenant id. Access is granted per property, through permission codes
such as `ISSUE_VIEW` or `ANALYTICS_VIEW`. So three layers decide what the assistant can do:

| Layer | Where | What it does |
|---|---|---|
| 1. What the model is offered | `ToolRegistry.availableFor` | Keeps tools whose permission the user holds on at least one property (from `/me/context`). The model never learns other tools exist. |
| 2. What may run | `AgentRuntime` | Refuses any tool call that isn't in this request's offered set, or isn't `READ`. |
| 3. What data comes back | Livic backend | Every tool call carries the user's own token, so the backend's `@PreAuthorize` checks and service-level scoping apply exactly as they do for the app. |

Layer 3 is the one that truly matters: even a tool bug can't show data the user couldn't see in the
app.

**Residents** hold no property memberships, so no tools are offered. They get a fixed reply and the
model is never called.

**The user's token** stays in memory for the length of the request. It is never written to the
database, and `AgentContext` and `ToolExecutionContext` leave it out of their `toString()`.

**Prompt injection:**
- The prompt tells the model that tool results are data, not instructions.
- More importantly, every tool is read-only and runs with the user's own rights, so injected text can't
  make the assistant change anything or see more.

## Calling the backend (`client/BackendClient`)

| Method | Does |
|---|---|
| `get(path, query, userToken)` | GET with `Authorization: Bearer <userToken>`, skips null query values, returns the `data` field of the backend's `ApiResponse`. |
| `meContext(userToken)` | `GET /api/v1/me/context`. |

- **Base URL:** `BACKEND_BASE_URL` (default `http://localhost:8080`).
- **Synchronous:** it uses `WebClient` but blocks for the reply, for up to **10 seconds**. See
  [agent-runtime.md](agent-runtime.md#everything-is-synchronous).
- **Errors** become a `BackendException` whose message is safe to show:
  - the backend's own `error` text when it gives one;
  - otherwise a default for 401, 403 and 404;
  - "did not respond" for timeouts and connection failures.

  Inside a tool, that message goes to the model as an `ERROR` result. During `/me/context`,
  `GlobalExceptionHandler` returns 401 or 403 unchanged and 502 for anything else.

ai-service only reads through the backend's public API. It has no credentials or entities for business
tables.

## The audit tables (`persistence/`)

The backend owns the schema: both tables come from
`backend/src/main/resources/db/migration/V5__ai_execution_tables.sql`, which also dropped the old
`ai_job_tbl`. ai-service has Flyway switched off and runs Hibernate with `ddl-auto: validate`, so it
refuses to start if its entities don't match the tables.

### `ai_execution_tbl`: one row per question (`AgentExecution`)

| Column | Meaning |
|---|---|
| `id` | The `executionId` returned to the app. |
| `user_id` | Who asked. Foreign key to `user_tbl`; rows are deleted with the user. |
| `agent_id` | `landlord-assistant`. |
| `status` | `RUNNING`, `COMPLETED` or `FAILED`. |
| `steps` | Model calls made (0 when the model was skipped). |
| `prompt` | The user's message. |
| `final_response` | What the user was shown. |
| `error_message` | Why it failed: `MAX_STEPS_EXCEEDED`, or the provider or backend error. |
| `model` | The model that answered, e.g. `gemini-2.5-flash`. |
| `input_tokens`, `output_tokens` | Summed over all steps. |
| `created_at`, `updated_at` | Timing. |

### `ai_tool_execution_record_tbl`: one row per tool call (`ToolExecutionRecord`)

| Column | Meaning |
|---|---|
| `execution_id` | Which run. Deleted with it. |
| `step_number` | Which model call asked for it. |
| `tool_name` | What the model asked for, even if it doesn't exist. |
| `input_payload` | The model's raw arguments. |
| `output_payload` | The lean data returned to the model (empty for errors and refusals). |
| `status` | `SUCCESS`, `ERROR` or `DENIED`. |
| `duration_ms` | Time spent, including the backend call. |
| `error_message` | Why it failed or was refused. |

Records are written once and never updated.

### Useful queries

```sql
-- Latest questions and how they ended
SELECT created_at, status, steps, LEFT(prompt, 60) AS prompt, error_message
FROM ai_execution_tbl ORDER BY created_at DESC LIMIT 20;

-- What the assistant did to answer one question
SELECT step_number, tool_name, status, duration_ms, input_payload, LEFT(output_payload, 200) AS output
FROM ai_tool_execution_record_tbl
WHERE execution_id = '<executionId>' ORDER BY created_at;

-- Refused or failing tools
SELECT tool_name, status, error_message, COUNT(*) AS times
FROM ai_tool_execution_record_tbl WHERE status <> 'SUCCESS'
GROUP BY tool_name, status, error_message ORDER BY times DESC;
```

These tables hold resident names and amounts copied from tool results. Treat them as personal data,
just like the business tables.
