---
name: backend-engineering
description: "Modular monolith architecture, package-by-feature, DDD-lite, database table/column naming, Flyway migrations, API response envelopes, pagination, structured logging, and performance standards for Spring Boot."
---

# Senior Backend Engineer - Production-Grade Spring Boot Standards

Before generating or modifying any code, STRICTLY follow the engineering standards defined below.

---

## ARCHITECTURE STANDARD

* Architecture: Modular Monolith
* Pattern:
  * Package-by-feature
  * Layered architecture
  * DDD-lite

Module structure:
module/
├── controller/
├── service/
│   ├── interface/
│   └── impl/
├── domain/
├── repository/
├── dto/
├── mapper/

---

## MODULE BOUNDARY RULES

* **Bounded Contexts Only**: Modules must be organized by Domain (Bounded Contexts), NOT by individual database tables (Entity Services).
* Approved modules, grouped under `com.livic.<group>.<module>`:
  * `platform` - Shared foundations with no business rules:
    1. `common` / `config` - Cross-cutting concerns.
    2. `security` - Current-user principal and JWT verification (depends only on `common`).
    3. `auth` - Identity & Access Management (Logins, Tokens, Memberships, Roles & Permissions).
    4. `user` - Core User Profile and Global Roles.
    5. `notification` - Multi-channel alert delivery (Email, Push, WhatsApp).
    6. `storage` - Pluggable media storage and CDN integration (Cloudinary, S3, R2, Local).
    7. `payment` - Payment gateway integrations (Razorpay, Stripe, PayPal), payment initiation, webhooks, and ledger transactions.
  * `services` - Core business domain:
    8. `property` - Real Estate / Asset Management (Properties, Units, Layouts, Property Join Codes).
    9. `finance` - Tenancy & Financials (Leases, Rent Cycles, Expenses, Splits).
    10. `billing` - Landlord SaaS subscriptions, plan tiers, feature limits, and quota enforcement.
  * `features` - Product features built on services:
    11. `announcement` - Targeted announcements/broadcasts to properties, floors, or units.
    12. `issue` - Maintenance tickets, issue reporting, priority triage, and resolution workflows.
    13. `analytics` - Business intelligence, revenue metrics, occupancy rates, and operational reporting.
    14. `inventory` - Physical asset registry, appliances, condition tracking, and lease move-in/move-out lifecycle.
    15. `marketplace` - Public rental listings, prospect OTP verification, tour requests and bookings, and landlord visiting hours.
* Dependencies flow `features` -> `services` -> `platform`, and modules must stay free of cycles (enforced by `ModuleBoundaryTest`). When a lower module needs a higher one, define an SPI in the lower module or publish a synchronous event.
* No direct repository access across modules
* Modules communicate ONLY via facade or service interfaces (e.g. `com.livic.services.finance.facade` or `com.livic.services.finance.service.interfaces`)
* Controllers must remain thin
* Business logic only inside services

---

## DATABASE STANDARDS

1. Table naming:
* lowercase + "_tbl"
  Example: user_tbl, property_tbl

2. Column naming:
* snake_case

3. Primary keys:
* UUID only

4. Foreign keys:
* *_id format

5. Flyway:
* schema changes ONLY via migrations
* Never use ddl-auto=create/update

---

## API STANDARDS

Standard response format:
{
"success": true,
"data": {},
"error": null
}

Rules:
* **Domain-Prefixed Paths**: All API endpoints MUST be prefixed with the domain name (e.g., `/api/v1/finance/leases`, `/api/v1/property/properties`).
* Never expose entities directly
* Use DTOs for all APIs
* Use validation annotations
* Use proper HTTP status codes

---

## LOGGING & OBSERVABILITY

1. Structured JSON logging
2. Correlation ID required
3. Micrometer tracing enabled
4. Do NOT log:
* passwords
* tokens
* request bodies

Include in logs:
* correlationId
* traceId
* spanId

---

## NAMING CONVENTIONS

Classes:
* UserService
* UserServiceImpl
* CreatePropertyRequest
* PropertyResponse

Avoid:
* Utils
* CommonService
* GenericManager

---

## SECURITY RULES

* JWT-based auth
* Passwords must use BCrypt
* Never trust userId from request body
* Extract authenticated user from JWT

---

## DATA ACCESS & PERFORMANCE RULES

* **No Repository Calls in Loops**: Repository methods (e.g., `save`, `find`, `exists`, `delete`) must NEVER be called inside loops (`for`, `while`) or lambda iteration blocks (like `.forEach()`, `.map()`).
  * Fetch required data in bulk outside the loop using `IN` queries (e.g., `findAllByXIn()`).
  * Cache, lookup, and associate data in-memory using Maps or Sets.
  * Batch execute database modifications (e.g., `saveAll()`, `deleteAll()`) outside the loop.
* **N+1 Query Avoidance**: Never lazy-load relational collections in loops or iterate over parent entities fetching children one-by-one. Always use `@EntityGraph`, `JOIN FETCH` JPQL queries (e.g., `@Query("SELECT p FROM SubscriptionPlanTbl p JOIN FETCH p.features")`), or bulk `IN` fetch queries mapped in-memory using `Map<UUID, List<T>>`.
* **Mandatory Pagination for Dynamic Lists**: Any query or endpoint returning collections that grow dynamically over time (e.g., Ledger entries, Expenses, Rent Cycles, Announcements, Audit logs) MUST implement pagination using Spring's `Pageable` and return `Page<T>` instead of raw lists (`List<T>`).
* **Decoupled CRUD Service Layer**: Direct repository injection in high-level business services is discouraged. Abstraction interfaces (`CrudService<T, ID>`) and domain CRUD services (e.g., `UserCrudService`) must be used to wrap direct database repository calls.

---

## CODE QUALITY RULES

* No commented-out code
* No dead code (remove unused interface method overloads and implementation code immediately)
* No duplicate logic
* Keep methods small and readable
* Use constructor injection only
* **Code Reuse and Redundancy Check**: Always inspect the codebase to verify if a utility method, mapper, conversion helper, or business function already exists before writing new code. Reuse existing structures instead of writing redundant code.
* **Clean Import Styling — No Inline Imports**: Fully-qualified class names (e.g., `org.springframework.data.domain.Page`, `java.util.List`, `com.livic.services.property.dto.PropertySummaryDTO`) MUST NEVER appear inline inside method signatures, field declarations, return types, or code bodies. **All types, regardless of package, must be declared as top-level `import` statements at the top of the file** and referenced using their simple class names throughout the code. This rule applies universally — Spring types, JPA types, internal domain types, third-party library types, and standard Java types are all subject to this rule. Violations of this rule are treated as compile-style errors that block PR approval.
* **Service-DTO Decoupling & Mapper Conventions**: To maintain pure business logic in service implementations, DTO-to-entity and entity-to-DTO conversion must be decoupled from the service layer and delegated to dedicated, stateless mapper utility classes.
  * Mappers must follow the naming pattern `<DomainName>Mapper` (e.g., `LeaseMapper`) and define a `private` constructor to prevent instantiation.
  * DTO-to-Entity mapping methods must be named `toEntity(...)` (accepting custom type-safe arguments for contextual domain dependencies like unit/property entities).
  * Entity-to-DTO mapping methods must be named `toResponse(...)`.
  * Generic mapper interfaces must not be used to avoid destroying compile-time type safety for custom contextual parameters.

---

## TESTING RULES

* Every phase must:
  * compile successfully
  * run successfully
  * expose working APIs

---

## IMPORTANT

This project follows FAANG-grade engineering discipline.

Prioritize:
* clarity
* maintainability
* scalability
* observability

Do NOT overengineer.
Do NOT introduce unnecessary abstractions.
