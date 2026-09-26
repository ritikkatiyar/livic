# Livic AI Service

Runs Livic's AI assistant. A stateless agent loop gives the model a set of read-only tools, runs the
calls it asks for against the backend as the signed-in user, and records every run and tool call in
`ai_execution_tbl` and `ai_tool_execution_record_tbl`. Design: `docs/AI_ARCHITECTURE_DESIGN.md`.

- `agent/` - agent definitions and the per-request context
- `orchestration/` - `AgentRuntime`, the tool loop
- `tools/` - tool contracts and registry; `tools/impl/` holds the tools
- `llm/` - model contracts; `llm/adapter/` is the only package that uses Spring AI (enforced by `ArchitectureTest`)

To enable it locally set `APP_AI_ENABLED=true`, `SPRING_AI_MODEL_CHAT=google-genai` and `GEMINI_API_KEY`.

## Run locally

```bash
cd ai-service
mvn spring-boot:run
```

## Build

```bash
cd ai-service
mvn -DskipTests package
```

## Docker

```bash
docker build -t tenant-living-ai-service:local ./ai-service
```

## Endpoints

- `POST /api/v1/ai/commands` - runs the landlord assistant on one message and returns its answer
