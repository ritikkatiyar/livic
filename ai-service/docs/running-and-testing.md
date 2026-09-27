# Running and testing

## What you need

- Java 21 and Maven.
- MySQL from the repo's `docker-compose.yml` (port 3307).
- **The backend running first.** It applies the Flyway migrations that create ai-service's tables, and
  ai-service calls it for every question.
- A Gemini API key, to get real answers.

## Configuration

All settings live in `src/main/resources/application.yml` (plus `-dev` and `-prod`). The `dev`
profile is active by default.

| Variable | Default | Notes |
|---|---|---|
| `SERVER_PORT` | `8081` | **Use `8082` locally.** The apps look for ai-service on 8082 because Expo uses 8081. |
| `APP_AI_ENABLED` | `false` | `true` to answer questions; otherwise every request gets 503. |
| `SPRING_AI_MODEL_CHAT` | `none` | `google-genai` for Gemini. |
| `GEMINI_API_KEY` | (empty) | Required for answers. |
| `GEMINI_MODEL`, `GEMINI_TEMPERATURE` | `gemini-2.5-flash`, `0.2` | |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | local `livic` database | Same database as the backend. |
| `APP_JWT_SECRET` | dev secret | **Must match the backend's**, or every request gets 401. |
| `BACKEND_BASE_URL` | `http://localhost:8080` | |
| `APP_CORS_ALLOWED_ORIGINS` | localhost ports | Add the web app's origin if it differs. |

ai-service does **not** read the repo's `.env` by itself. Either export the variables, or point Spring
at the file as shown below. Command-line arguments still override values from `.env`.

## Run it

From `ai-service/`:

```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.config.import=optional:file:../.env[.properties] --SERVER_PORT=8082 --APP_AI_ENABLED=true --SPRING_AI_MODEL_CHAT=google-genai"
```

Or build and run the jar:

```bash
mvn -DskipTests package
```

```bash
java -jar target/livic-ai-service-0.0.1-SNAPSHOT.jar --spring.config.import=optional:file:../.env[.properties] --SERVER_PORT=8082 --APP_AI_ENABLED=true --SPRING_AI_MODEL_CHAT=google-genai
```

Check it is up: `GET http://localhost:8082/health` returns `OK`.

## Try it

Log in to the backend as a seeded landlord (for example `owner@moms.com`; the seed password is in the
backend's V2 migration), then ask a question with the token:

```bash
curl -s -X POST http://localhost:8082/api/v1/ai/commands -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"message":"Which residents have overdue payments?"}'
```

Then check what it did with the queries in [data-and-security.md](data-and-security.md#useful-queries).

Good questions to try:

| Question | Expect |
|---|---|
| "Which properties do I manage?" | `property_list`, names listed |
| "How much rent have we collected this month?" | `analytics_summary` |
| "What urgent issues do we have and what's the latest on them?" | `issue_list`, latest updates quoted |
| "Tell me the full history of the lift issue" | `issue_list` then `issue_get` |
| "Send a reminder to every resident" | a polite refusal, no tool call |
| Any question with a resident's token | the fixed no-access reply, `steps = 0` |

## Tests

```bash
mvn test
```

The tests need no database, backend or API key.

| Test | Covers |
|---|---|
| `AgentRuntimeTest` | The loop with a scripted fake model: a tool call then an answer, the prompt filled with property names, unknown tools refused, write tools refused, bad arguments rejected, the step limit, model errors, and callers with no tools never reaching the model. |
| `ToolRegistryTest` | Tool filtering by allowlist × permissions, and duplicate names failing at startup. |
| `ToolSchemaTest` | Optional input fields stay optional in the schema; required ids keep their descriptions. |
| `ArchitectureTest` | Only `llm/adapter` uses Spring AI; tools don't depend on the runtime, persistence or model code. |

## Known gaps

- `dev.ps1 ai` still starts ai-service on port 8081 against the old `tenant_living` database and
  credentials. Use the commands above instead.
- `docker-compose.yml` doesn't include ai-service.
- The Gemini free tier allows about 20 requests a day for `gemini-2.5-flash` (see [llm.md](llm.md)).
- Each message stands alone: there is no conversation memory yet.
