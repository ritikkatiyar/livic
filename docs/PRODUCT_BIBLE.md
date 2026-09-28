# Livic — Complete Product Bible

> **Repository**: `github.com/ritikkatiyar/livic` (branch: `main`)
> **Local path**: `D:\TenantApp`
> **Last updated**: 2026-08-20

---

## 1. What Is Livic?

Livic is a **multi-tenant property management SaaS platform** for Indian landlords and residents. It manages the full lifecycle of rental properties: onboarding, unit/floor management, lease creation, monthly billing pipelines, payment collection (Razorpay), inventory tracking, maintenance ticketing, announcements, and AI-assisted operations.

The product ships **two separate frontend apps** (Landlord and Resident) sharing a single backend API and a standalone AI micro-service.

---

## 2. Monorepo Layout

```
D:\TenantApp/
├── backend/                  # Spring Boot 4.0.5 (Java 21) — main API
├── ai-service/               # Spring Boot 4.0.5 + Spring AI (Google GenAI)
├── livic-landlord-fe/        # Expo SDK 54 / React Native 0.81 — landlord app
├── livic-resident-fe/        # Expo SDK 54 / React Native 0.81 — resident app
├── docker-compose.yml        # MySQL 8.4 + backend containers
├── dev.ps1                   # PowerShell dev orchestrator script
├── .env / .env.example       # Root environment variables
└── docs/                     # Documentation assets
```

---

## 3. Backend Service (`backend/`)

### 3.1 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Spring Boot **4.0.5**, Java **21** |
| ORM | Spring Data JPA + Hibernate (validate mode) |
| Database | MySQL **8.4** (Docker, port 3307→3306) |
| Migrations | Flyway (8 migrations: V1–V8) |
| Auth | JWT (jjwt 0.12.6) + Spring Security |
| Payments | Razorpay Java SDK 1.4.9 |
| Media | Cloudinary SDK 2.0.0 |
| Observability | Micrometer Tracing, Logstash encoder, Spring Actuator |
| API Docs | SpringDoc OpenAPI (Swagger UI) |
| Code Quality | Spotless, Lombok, ArchUnit |

### 3.2 Package Structure (`com.livic.*`)

Each domain module follows a consistent **package-by-feature** layout:

```
com.livic.{module}/
├── controller/    # REST endpoints
├── domain/        # JPA entities
├── dto/           # Request/response DTOs
├── repository/    # Spring Data repos
├── service/       # Business logic
├── facade/        # Orchestration layer (optional)
├── mapper/        # Entity ↔ DTO mapping (optional)
├── event/         # Domain events (optional)
└── strategy/      # Strategy pattern implementations (optional)
```

### 3.3 Domain Modules

| Module | Purpose | Key Controllers |
|---|---|---|
| `auth` | Signup, login, JWT refresh, lockout, property staff memberships | `AuthController`, `MembershipController` |
| `user` | User profiles, preferences, global roles | `UserController` |
| `property` | Property CRUD, floors, units, grid layout | `PropertyController`, `UnitController`, `PropertyRoleController`, `PropertyJoinCodeController` |
| `finance` | Charge configs, meter readings, worksheets, rent cycles, leases, ledger, invoices, bookings | `ChargeConfigController`, `MeterReadingController`, `BillingWorksheetController`, `RentCycleController`, `LeaseController`, `LedgerController`, `InvoiceController`, `UnitBookingController` |
| `payment` | Razorpay integration, cash recording, webhook processing | `PaymentController` |
| `billing` | SaaS subscription plans, feature limits, wallet, usage enforcement | `BillingController` |
| `inventory` | Item master, lease-level inventory assignments, move-in/out | `InventoryController`, `LeaseInventoryAssignmentController` |
| `announcement` | Property-wide notices, read receipts | `AnnouncementController` |
| `issue` | Maintenance tickets (tenant-reported) | `IssueController` |
| `notification` | Multi-channel dispatch (Email, WhatsApp, Push, SMS) | Event-driven (no direct controller) |
| `storage` | Cloudinary media upload, authorized URL generation | `MediaController` |
| `analytics` | Dashboard aggregation queries | `AnalyticsController` |
| `common` | Shared enums, base entities, exceptions, response wrappers, logging | — |
| `config` | Security config, CORS, JWT properties, OpenAPI, Jackson | — |

### 3.4 Authentication & Authorization

- **Auth flow**: Email/phone signup → password hash (BCrypt) → JWT access token (15 min) + refresh token (7 days)
- **Lockout**: 5 failed attempts → 15-minute lockout
- **Global roles**: `USER`, `ADMIN`, `SUPER_ADMIN`
- **Property-level RBAC**: Each property has `membership_role_tbl` entries (PROPERTY_OWNER, PROPERTY_MANAGER, PROPERTY_CARETAKER, PROPERTY_TENANT, plus custom roles). Each role maps to permissions via `role_permission_tbl`.
- **Permissions**: Fine-grained codes like `PROPERTY_VIEW`, `LEASE_CREATE`, `EXPENSE_APPROVE`, `MANAGE_STAFF`, etc.
- **Join codes**: Owners generate single-use invite codes (`property_join_code_tbl`) tied to a target role for staff onboarding.

### 3.5 The Billing Pipeline (Core Business Flow)

This is the heart of the product — a 4-step monthly workflow:

```
Step 1: Charge Configuration
    └── Define recurring charges per property (rent, electricity, food, maintenance, etc.)
    └── Each charge has: calculation_strategy (FLAT, PER_UNIT, METERED), billing_frequency, base_rate

Step 2: Billing Worksheets / Meter Readings
    └── Input variable data each month: meter readings, one-off charges
    └── billing_worksheet_entry_tbl stores per-unit, per-charge, per-month values
    └── meter_reading_tbl stores previous/current readings for metered charges

Step 3: Rent Roll Generation (Rent Cycles)
    └── System compiles all charges → creates rent_cycle_tbl (one per lease per month)
    └── Each cycle has rent_cycle_charge_tbl line items
    └── Status flow: PENDING → PUBLISHED → PAID / PARTIALLY_PAID / OVERDUE
    └── Publishing sends invoice notification to tenants

Step 4: Finance Ledger
    └── Immutable audit trail in finance_ledger_tbl
    └── Transaction types: INVOICE_GENERATED, PAYMENT_RECEIVED, LATE_FEE_APPLIED, REFUND, ADJUSTMENT
    └── Running balance per unit
```

### 3.6 SaaS Subscription Model

- `subscription_plan_tbl`: Plans (Starter, Basic, Premium, Enterprise) with monthly/yearly pricing
- `plan_feature_limit_tbl`: Feature quotas per plan (e.g., max properties, max units, AI credits)
- `saas_subscription_tbl`: Per-user active subscription with Razorpay gateway integration
- `billing_wallet_tbl` + `wallet_transaction_tbl`: Credit system for metered features (AI usage)
- Enforcement via `@RequiresFeature` annotation + AOP aspect in `billing` module

---

## 4. Database Schema (MySQL 8.4)

### 4.1 All Tables (30+)

| Table | Domain | Purpose |
|---|---|---|
| `user_tbl` | Auth | User accounts (auth_uid, full_name, phone, password_hash, global_role) |
| `refreshtoken_tbl` | Auth | JWT refresh tokens |
| `user_preference_tbl` | User | Active mode (RENTAL/HOSTEL/MESS/SOCIETY), onboarding status |
| `user_device_token_tbl` | Notification | Push notification device tokens |
| `property_tbl` | Property | Properties (name, address, city, type, auto_bill settings) |
| `unit_tbl` | Property | Units within properties (number, floor, type, capacity, grid position) |
| `membership_role_tbl` | Property | Role definitions (system + custom per property) |
| `permission_tbl` | Property | Permission code catalog |
| `role_permission_tbl` | Property | Role-to-permission mapping |
| `membership_tbl` | Property | User-to-property-to-role assignments |
| `property_join_code_tbl` | Property | Staff invite codes |
| `property_module_tbl` | Property | Feature module toggles per property |
| `lease_tbl` | Finance | Tenant leases (user, unit, dates, rent, deposit, split strategy) |
| `charge_config_tbl` | Finance | Billing charge templates per property |
| `meter_reading_tbl` | Finance | Monthly meter readings per unit per charge |
| `billing_worksheet_entry_tbl` | Finance | Manual billing worksheet entries |
| `rent_cycle_tbl` | Finance | Monthly invoice per lease (status, amounts) |
| `rent_cycle_charge_tbl` | Finance | Line items within a rent cycle |
| `finance_ledger_tbl` | Finance | Immutable financial audit trail |
| `unit_booking_tbl` | Finance | Prospective tenant bookings with token amounts |
| `payment_transaction_tbl` | Payment | All payment records (cash + gateway) |
| `payment_webhook_event_tbl` | Payment | Razorpay webhook events |
| `failed_payment_event_tbl` | Payment | Failed webhook processing retry queue |
| `webhook_event_log_tbl` | Payment | Gateway webhook audit log |
| `subscription_plan_tbl` | Billing | SaaS plan catalog |
| `plan_feature_limit_tbl` | Billing | Feature quotas per plan |
| `saas_subscription_tbl` | Billing | Active user subscriptions |
| `billing_wallet_tbl` | Billing | User credit wallets |
| `wallet_transaction_tbl` | Billing | Wallet debit/credit log |
| `announcement_tbl` | Announcement | Property notices |
| `announcement_receipt_tbl` | Announcement | Read receipts per user |
| `maintenance_ticket_tbl` | Issue | Tenant maintenance requests |
| `notification_log_tbl` | Notification | Multi-channel notification audit |
| `ai_job_tbl` | AI | Async AI task queue |
| `inventory_item_tbl` | Inventory | Master inventory catalog per property |
| `lease_inventory_assignment_tbl` | Inventory | Items assigned to a lease (move-in/out tracking) |

### 4.2 Flyway Migrations

| Version | Description |
|---|---|
| V1 | Full initial schema (30+ tables) |
| V2 | Seed data (default roles, permissions, subscription plans) |
| V3 | Issue/maintenance ticket schema |
| V4 | Drop legacy maintenance_ticket (replaced by V3) |
| V5 | Update announcement target column |
| V6 | User device token table |
| V7 | Rename membership assigned_by column |
| V8 | Storage + inventory schema |

---

## 5. AI Service (`ai-service/`)

A **standalone Spring Boot micro-service** that handles AI-powered features:

- **Spring AI** with Google GenAI (Gemini) integration
- Shares the same MySQL database (reads `ai_job_tbl`)
- Async job processing: backend creates an AI job → ai-service polls and processes → writes response back
- JWT-based internal auth (validates user tokens from the main backend)
- Runs on its own port (separate container in production)

---

## 6. Frontend Apps

Both frontends use identical tech stacks but serve different user personas.

### 6.1 Shared Tech Stack

| Technology | Version |
|---|---|
| Expo SDK | 54 |
| React Native | 0.81.5 |
| React | 19.1.0 |
| Router | expo-router 6 (file-based routing) |
| Animations | react-native-reanimated 4.1 |
| Blur/Glass | expo-blur 15 |
| Gradients | expo-linear-gradient 15 |
| Secure Storage | expo-secure-store 15 |
| Camera | expo-camera |
| Icons | @expo/vector-icons (MaterialIcons) |
| TypeScript | 5.9 |

### 6.2 Landlord App (`livic-landlord-fe/`)

**Target user**: Property owners, managers, caretakers.

#### Route Structure (`app/`)

| Route | Screen |
|---|---|
| `/login` | Login screen |
| `/signup` | Signup screen |
| `/mode-selection` | Business mode selector |
| `/onboarding` | First-time setup wizard |
| `/command-center` | Property portfolio dashboard |
| `/analytics` | Overview dashboard |
| `/reports` | Reports & analytics |
| `/expenses` | Finance & Billing hub |
| `/expenses/charge-config` | Charge configuration |
| `/expenses/billing-worksheet` | Billing worksheets |
| `/expenses/rent-roll` | Rent roll generation |
| `/expenses/ledger` | Finance ledger |
| `/create-expense` | Create expense |
| `/properties/create` | Create new property |
| `/properties/[id]` | Property detail |
| `/properties/[id]/edit` | Edit property |
| `/properties/[id]/floors` | Floor list overview |
| `/properties/[id]/floors/[floor]` | Floor editor (unit grid) |
| `/inventory` | Inventory management |
| `/leases` | Lease management |
| `/announcements` | Announcement admin |
| `/escalations` | Maintenance escalations |
| `/ai` | AI desk |
| `/settings` | System settings (roles, invites, preferences, theme) |
| `/billing` | SaaS subscription management |

#### Feature Modules (`src/features/`)

| Module | Contents |
|---|---|
| `auth` | Login, signup screens + `AuthProvider` context |
| `properties` | Property CRUD, floor editor, unit grid, command center, membership management |
| `finance` | Full billing pipeline screens + API clients |
| `inventory` | Inventory registry, move-in/out, item modals |
| `leases` | Lease list and management |
| `announcements` | Announcement composer + history |
| `analytics` | Dashboard analytics |
| `reports` | Reports screen |
| `ai` | AI assistant integration |
| `issues` | Escalation management |
| `storage` | Media upload utilities |
| `user` | User profile management |
| `tenant` | Tenant-facing views (shared components) |

### 6.3 Resident App (`livic-resident-fe/`)

**Target user**: Tenants living in managed properties.

#### Route Structure (`app/`)

| Route | Screen |
|---|---|
| `/login` | Login |
| `/signup` | Signup |
| `/onboarding` | Join property via invite code |
| `/tenant-home` | Tenant dashboard |
| `/tenant-property` | Property details view |
| `/tenant-inventory` | Assigned inventory list |
| `/tenant-payments` | Payment history & pay rent |
| `/tenant-maintenance` | Submit/track maintenance requests |
| `/settings` | Theme preferences, about |

---

## 7. Shared Architecture Patterns

### 7.1 API Client (`src/api/client.ts`)

Both frontends share the same pattern:
- Base URL from `.env` (`EXPO_PUBLIC_API_URL`, default `http://localhost:8080`)
- `apiClient` wrapper that auto-injects `Authorization: Bearer <token>` header
- Feature-specific API files (e.g., `rentCycle.api.ts`, `property.api.ts`) export typed functions

### 7.2 Auth Context (`AuthProvider.tsx`)

- Stores `accessToken`, `refreshToken`, `user` object, and `context` (managed properties with roles)
- Persists tokens via `expo-secure-store` (native) / `localStorage` (web)
- Provides `signIn`, `signUp`, `signOut`, `refreshSession` methods
- `context` object contains `managedProperties[]` with `propertyId`, `membershipRoleCode`, `permissionCodes[]`

### 7.3 Responsive Design (`useResponsive` hook)

```typescript
// Returns { isDesktop: boolean } based on window width > 768px
// Used everywhere to switch between:
//   - Desktop: SidebarNavigation + DesktopNavBar + wide content
//   - Mobile: BottomNavigation + MobileHeader + scroll-sensitive pills
```

### 7.4 Navigation Architecture

**Desktop (web)**:
- Left: `SidebarNavigation` (collapsible, 260px → 80px)
- Top: `DesktopNavBar` (property selector dropdown, theme toggle, avatar)

**Mobile (native + web narrow)**:
- Bottom: `BottomNavigation` (5 tabs)
- Top: Scroll-sensitive `MobileHeader` with dissolve animation
- Sheet: `MobileMoreSheet` (extra menu items)
- QR: `QRScannerModal` (expo-camera)

---

## 8. Theme System

### 8.1 Design Tokens (`src/theme/Theme.ts`)

Both apps share identical token structure:

| Token Group | Contents |
|---|---|
| `LightColors` / `DarkColors` | 50+ Material Design 3 color tokens (primary, surface, error, etc.) + glass tokens |
| `LightSurface` / `DarkSurface` | Card, page, border, overlay, shadow color tokens |
| `Typography` | Inter font family, 15+ type scales (Display, Headline, Title, Body, Label) |
| `Spacing` | xs(4) → xxl(48), gutter(16), containerPadding(24) |
| `Rounded` | xs(4) → full(9999) border radius tokens |

### 8.2 Theme Context (`src/theme/ThemeContext.tsx`)

- `ThemeContextProvider` wraps the entire app
- Supports 3 modes: `light`, `dark`, `system`
- Persists choice in `localStorage` (web) / `SecureStore` (native)
- `useAppTheme()` hook returns: `{ theme, isDark, mode, setMode, toggleTheme }`
- `ThemeRevealOverlay`: Animated radial expansion transition when toggling themes
- All screens use `const { theme, isDark } = useAppTheme()` and pass tokens to `createStyles(theme, isDark)`

### 8.3 Glassmorphism Design Language

The UI uses a consistent glassmorphic aesthetic:
- `expo-blur` `BlurView` with intensity 55–70
- `glassFill` / `glassStroke` color tokens for translucent backgrounds
- `LinearGradient` background washes
- Subtle shadows with `elevation` for depth

---

## 9. Shared UI Components (`src/components/common/`)

| Category | Components |
|---|---|
| **display/** | `GlassCard`, `EmptyState`, `StatusPill`, `StatCard`, `SectionHeader` |
| **inputs/** | `ActionButton`, `GlassDropdown` |
| **feedback/** | `ConfirmDialog`, `ToastContext` (toast notification system) |
| **layout/** | `PageShell` (gradient background + safe area + scroll), `ResponsiveHeader` |
| **navigation/** | `SidebarNavigation`, `DesktopNavBar`, `BottomNavigation`, `MobileHeader`, `MobileMoreSheet`, `FloatingBackButton`, `QRScannerModal`, `ScrollContext` |

---

## 10. Infrastructure & DevOps

### 10.1 Docker Compose

```yaml
services:
  mysql:        # MySQL 8.4, port 3307:3306, volume: livic_mysql_data
  backend:      # Spring Boot, port 8080, depends on mysql healthcheck
```

### 10.2 Environment Variables (`.env`)

| Variable | Purpose |
|---|---|
| `MYSQL_DATABASE/USER/PASSWORD` | Database credentials |
| `APP_JWT_SECRET` | JWT signing key (≥32 bytes) |
| `APP_CORS_ALLOWED_ORIGINS` | CORS whitelist |
| `RAZORPAY_KEY_ID/KEY_SECRET` | Payment gateway |
| `CLOUDINARY_*` | Media storage |
| `EMAIL_*` | SMTP config |
| `WHATSAPP_*` | WhatsApp Business API |
| `EXPO_PUBLIC_API_URL` | Frontend → backend URL |

### 10.3 Development Workflow

```bash
# 1. Start infrastructure
docker compose up -d mysql

# 2. Start backend (from backend/)
./mvnw spring-boot:run

# 3. Start landlord FE (from livic-landlord-fe/)
npm run dev          # expo start --web --offline

# 4. Start resident FE (from livic-resident-fe/)
npm run dev          # expo start --web --offline
```

### 10.4 Key Scripts

| Command | Location | Purpose |
|---|---|---|
| `npm run dev` | Both FEs | Start Expo dev server (web, offline) |
| `npm run build` | Both FEs | Export static web build |
| `npm run typecheck` | Both FEs | `tsc --noEmit` |
| `npm run quality` | Both FEs | lint + typecheck + test + build |
| `./mvnw spring-boot:run` | backend | Start Spring Boot |
| `./mvnw test` | backend | Run tests |

---

## 11. Key Conventions & Patterns

### 11.1 Backend

- **Table naming**: `{entity}_tbl` (e.g., `user_tbl`, `lease_tbl`)
- **ID format**: UUID v4 stored as `varchar(36)`
- **Timestamps**: `created_at` + `updated_at` with `datetime(6)` precision
- **Hibernate mode**: `validate` (schema managed entirely by Flyway)
- **API prefix**: `/api/v1/{resource}`
- **Response envelope**: Standard `ApiResponse<T>` wrapper with `success`, `data`, `message`, `errors`
- **Pagination**: Spring `Pageable` with `page`, `size`, `sort` params

### 11.2 Frontend

- **File-based routing**: `app/` directory maps to URL routes via expo-router
- **Feature modules**: `src/features/{name}/` with `api/`, `screens/`, `components/`, `hooks/`
- **Dynamic styles**: `createStyles(theme, isDark)` factory functions (never static `StyleSheet.create`)
- **Hook pattern**: `useAppTheme()` for colors, `useResponsive()` for breakpoints, `useProperties()` for property list
- **Platform detection**: `Platform.OS === 'web'` for web-specific behavior
- **Glass UI**: All cards/surfaces use `BlurView` + `LinearGradient` + theme tokens

---

## 12. Current State & Known Items

- **Dark mode**: Fully implemented across both apps with animated theme transitions
- **Web theme toggle**: Available in DesktopNavBar (icon button) and SidebarNavigation (menu item)
- **Mobile theme toggle**: Available in MobileMoreSheet
- **Settings screen**: Both apps have Settings pages with System/Light/Dark mode selector
- **Resident FE**: Has fewer features than landlord (no finance pipeline, no property creation). Primarily: home dashboard, property view, inventory, payments, maintenance tickets.
- **Inventory module**: V8 migration added storage + inventory tables. Full CRUD with move-in/out tracking.
- **AI Service**: Standalone micro-service using Spring AI + Google GenAI. Processes async jobs from `ai_job_tbl`.
