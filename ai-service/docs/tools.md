# Tools

A tool is something the model can ask ai-service to do. Today every tool reads data from the Livic
backend as the signed-in user. Tools know nothing about the model: they get validated input and a
context, call the backend, and return a short result.

## The contracts (`tools/`)

### `AiTool<I>`

```java
public interface AiTool<I> {
    ToolDefinition definition();
    ToolResult execute(ToolExecutionContext context, I input);
}
```

`I` is the tool's input record. Tools are ordinary Spring `@Component`s; `ToolRegistry` finds them
automatically.

### `ToolDefinition`

| Field | Meaning |
|---|---|
| `name` | What the model calls, e.g. `issue_get`. Must be unique; a duplicate stops startup. |
| `description` | Tells the model *when* to use the tool. This is the tool's prompt, so write it carefully. |
| `inputType` | The input record class. Its JSON schema is what the model sees. |
| `capability` | `READ`, `WRITE`, `DESTRUCTIVE` or `EXTERNAL_SIDE_EFFECT`. Only `READ` runs today. |
| `requiredPermission` | A backend permission code (e.g. `ISSUE_VIEW`) the user must hold on at least one property, or `null` for none. |

### `ToolExecutionContext`

Who one call runs as: `userId`, `userToken` (relayed to the backend), `executionId`, `stepNumber` and
`requestId`. It comes from the verified request, never from model output. Its `toString()` omits the
token.

### `ToolResult`

| Field | Meaning |
|---|---|
| `status` | `SUCCESS`, `ERROR` or `DENIED`. |
| `summary` | One line that frames the data for the model, e.g. "2 residents have overdue bills...". |
| `data` | A lean projection of the backend response, never the raw DTO. |
| `errorMessage` | For `ERROR` and `DENIED`: a message safe for the model and the user. |

`toModelView()` is what the model receives: only the fields that are set, serialised to JSON.

### `ToolRegistry`

Collects every `AiTool` bean. `availableFor(agent, context)` returns the tools that are both in the
agent's allowlist and covered by a permission the user holds on some property. Only these are shown to
the model, and only these can run.

## The six tools (`tools/impl/`)

| Tool | Backend call | Permission | Input | What the model gets |
|---|---|---|---|---|
| `property_list` | `GET /api/v1/properties` | `PROPERTY_VIEW` | optional `search` | id, name, address, city, floors, active |
| `issue_list` | `GET /api/v1/issues?size=20` | `ISSUE_VIEW` | none | ticket, title, category, priority, status, escalation, property, block, created, **latest update** |
| `issue_get` | `GET /api/v1/issues/{id}` | `ISSUE_VIEW` | required `issueId` | full issue, assignee, last 10 timeline entries |
| `analytics_summary` | `GET /api/v1/analytics/summary` | `ANALYTICS_VIEW` | optional `billingMonth` (`YYYY-MM`) | expected vs collected rent, collection %, expenses to date |
| `analytics_defaulters` | `GET /api/v1/analytics/defaulters?size=20` | `ANALYTICS_VIEW` | none | resident, unit, property, block, days overdue, amount due |
| `announcement_list` | `GET /api/v1/announcement/announcements` | `ANNOUNCEMENT_VIEW` | optional `propertyId` | title, category, severity, date, first 300 characters, read counts |

List tools always return `{totalCount, shown, items}`. At most 20 rows go to the model, so it can say
"showing 20 of 142" instead of reading a whole table.

**Left out on purpose:** `analytics_summary` doesn't pass on the backend's growth rates (always 0) or
its `netProfit`, which subtracts all-time expenses from one month's collections. Expenses are labelled
`totalExpensesAllTime`.

### `ToolSupport`

Shared helpers for the tools:

- `PAGE_SIZE` (20);
- `params(...)` builds query parameters; null values are skipped by the client;
- `text(node, field)` reads a string field;
- `totalCount(page)` reads `totalElements` whether the page is flat or nested under `page`;
- `ListView.of(page, projection)` builds the standard list shape.

## Writing input records

The model only sees the JSON schema generated from the input record, so the annotations matter:

```java
public record Input(
        @JsonProperty(required = false)                        // optional: without this it is marked required
        @Pattern(regexp = "\\d{4}-\\d{2}", message = "must be YYYY-MM")   // checked before the tool runs
        @JsonPropertyDescription("Billing month as YYYY-MM; omit for the current month")  // shown to the model
        String billingMonth
) {
}
```

- **Every field is required unless marked `@JsonProperty(required = false)`.** Otherwise the model is
  forced to invent a value. `ToolSchemaTest` guards this for the current tools.
- **Use `@JsonPropertyDescription`** to explain each field to the model.
- **Use Jakarta validation** for rules; the runtime rejects bad input before `execute` is called.
- **Don't use Spring AI's `@ToolParam`.** Tools must stay free of Spring AI (`ArchitectureTest`).
- A tool with no input uses an empty record: `public record Input() {}`.

## Adding a tool

1. **Find the backend endpoint** and the permission code it checks.
2. **Create a class in `tools/impl/`:**

   ```java
   @Component
   @RequiredArgsConstructor
   public class LeaseListTool implements AiTool<LeaseListTool.Input> {

       public record Input(
               @JsonProperty(required = false)
               @JsonPropertyDescription("propertyId to limit the list to one property; omit for all")
               UUID propertyId
       ) {
       }

       record LeaseItem(String leaseId, String unitNumber, String status, BigDecimal rentAmount) {
       }

       private static final ToolDefinition DEFINITION = new ToolDefinition(
               "lease_list",
               "Lists leases across the user's properties with unit, status and rent.",
               Input.class,
               ToolCapability.READ,
               "LEASE_VIEW");

       private final BackendClient backend;

       @Override
       public ToolDefinition definition() {
           return DEFINITION;
       }

       @Override
       public ToolResult execute(ToolExecutionContext context, Input input) {
           JsonNode page = backend.get("/api/v1/finance/leases",
                   params("propertyId", input.propertyId(), "size", PAGE_SIZE), context.userToken());
           var view = ToolSupport.ListView.of(page, node -> new LeaseItem(
                   text(node, "id"), text(node, "unitNumber"), text(node, "status"),
                   node.path("rentAmount").decimalValue()));
           return ToolResult.success(view.totalCount() + " leases.", view);
       }
   }
   ```

   The endpoint and field names here are illustrative; check the real controller before copying.

3. **Add the tool's name** to `allowedToolNames` in `LandlordAgentConfig`.
4. **Keep the projection lean:** only fields the model needs, names rather than ids where possible, and
   no internal or personal fields it doesn't need (phone numbers, audit columns).
5. **Add its input to `ToolSchemaTest`** if it has optional fields.
6. **Run `mvn test`.** `ArchitectureTest` catches forbidden imports.

A tool that changes data (`WRITE` and beyond) will be refused by the runtime until the approval flow
exists.
