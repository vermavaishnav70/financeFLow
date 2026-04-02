# FinanceFlow Architecture

## System Structure
We follow a 3-tier Layered Architecture enforcing a clean separation of concerns.

1. **Routes Layer (`src/routes`)**:
   - Express router definitions.
   - Applies middleware (Auth, RBAC, Validation).
   - Responsible for HTTP status codes, extracting parameters, and formatting output via `ApiResponse`.
   - Contains NO business logic.

2. **Services Layer (`src/services`)**:
   - Business logic execution.
   - Interacts with Prisma.
   - Enforces business rules (e.g., verifying duplicates, preventing self-deletion).
   - Responsible for managing transactions and invoking the `audit.service.js`.

3. **Data Layer (`src/models` - implied via Prisma)**:
   - Defined centrally in `prisma/schema.prisma`.
   - Auto-generated Prisma client serves as the strongly-typed DAL.

## Core Mechanisms

### Request Flow
`Client Request -> Request ID -> Rate Limiter -> Express Route -> Auth Middleware -> RBAC Middleware -> Joi Validator -> Service Layer -> Prisma -> Database`

### Permission System
- Defined centrally in `src/permissions/index.js`.
- The `authorize(resource, action)` middleware references this static map.
- Defence in depth: The service layer still enforces domain-specific business rules such as admin self-deletion prevention and soft-delete handling.

### Database Indexing
Designed around specific aggregation query patterns:
- `@@index([type, date])` for filtering trends by transaction type over a date boundary.
- `@@index([category, type])` for the category-breakdown endpoint.
- `@@index([createdBy, isDeleted])` for creator attribution, auditability, and future creator-scoped queries without schema changes.

## File Map
- `src/app.js`: Master express instance. Configures global middlewares.
- `server.js`: Network binding and initialization.
- `src/config/`: Loading `.env`, setting up the Prisma singleton, Swagger setup.
- `src/middleware/`: Reusable Express route intercepts.
- `src/utils/`: Custom Error class, standard API response structure, and Winston logger.
