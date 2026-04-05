# FinanceFlow - Finance Data Processing & Access Control Backend

A production-ready backend system for a finance dashboard that manages financial records, user roles, permissions, and summary-level analytics. Built with Node.js, Express, PostgreSQL, and Prisma.

---

## Coverage

| Requirement | Status | Implementation |
|------------|--------|----------------|
| **User & Role Management** | ✅ | Three roles (Viewer, Analyst, Admin) with full CRUD and status management |
| **Financial Records Management** | ✅ | Complete CRUD with soft delete, recovery, filtering, search, pagination |
| **Dashboard Summary APIs** | ✅ | Overview, trends, category breakdown, insights, comparisons |
| **Access Control Logic** | ✅ | Centralized RBAC with middleware + service-layer enforcement |
| **Validation & Error Handling** | ✅ | Joi schemas, centralized error handler, proper HTTP status codes |
| **Data Persistence** | ✅ | PostgreSQL with Prisma ORM, indexed for analytics queries |

### Optional Enhancements Implemented
- ✅ JWT Authentication with token expiry
- ✅ Pagination for all list endpoints
- ✅ Search support (records by description)
- ✅ Soft delete with recovery functionality
- ✅ Rate limiting (general + stricter for auth)
- ✅ Unit & integration tests (Jest)
- ✅ API documentation (Swagger UI + offline markdown)
- ✅ Audit logging for all mutations
- ✅ Request ID middleware for log correlation
- ✅ Health check with database connectivity

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Request                              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Request ID → Rate Limiter → Auth → RBAC → Validator → Controller  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Service Layer                                │
│         (Business Logic + Audit Logging + Transactions)             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Prisma ORM → PostgreSQL                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Project Structure
```
backend/
├── src/
│   ├── app.js              # Express app configuration
│   ├── config/             # Environment, Prisma, Swagger setup
│   ├── middleware/         # Auth, RBAC, validation, rate limiting
│   ├── permissions/        # Centralized permission map
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic layer
│   ├── utils/              # ApiError, ApiResponse, logger
│   └── validators/         # Joi validation schemas
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.js             # Demo data seeder
├── tests/
│   ├── unit/               # Unit tests
│   └── integration/        # Integration tests
└── docs/
    └── API.md              # Offline API reference
```

---

## 🔐 Role-Based Access Control

| Role | Records | Dashboard | Users |
|------|---------|-----------|-------|
| **VIEWER** | ❌ No access | ✅ View all analytics | ✅ View own profile |
| **ANALYST** | ✅ Read only | ✅ View all analytics | ✅ View own profile |
| **ADMIN** | ✅ Full CRUD | ✅ View all analytics | ✅ Full CRUD |

**Implementation Details:**
- Permissions defined in `src/permissions/index.js`
- RBAC middleware (`authorize()`) enforces route-level access
- Two authentication modes:
  - `authenticate`: Fast JWT validation (for read operations)
  - `authenticateFreshUser`: DB-verified user status (for mutations)
- Service layer adds business rules (e.g., prevent self-deletion)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database (local or Supabase)

### Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed demo data
npm run seed

# 6. Start the server
npm run dev
```

### Demo Accounts
| Email | Role | Password |
|-------|------|----------|
| admin@financeflow.com | ADMIN | Password123! |
| analyst@financeflow.com | ANALYST | Password123! |
| viewer@financeflow.com | VIEWER | Password123! |

---

## 📚 API Documentation

### Interactive Docs
Start the server and visit: **http://localhost:3000/api-docs**

### Key Endpoints

#### Authentication
```
POST /api/v1/auth/register    # Register new user (public)
POST /api/v1/auth/login       # Login and get JWT
```

#### Users (Admin only, except /me)
```
GET    /api/v1/users/me           # Get current user profile
PATCH  /api/v1/users/me/password  # Update own password
GET    /api/v1/users              # List all users
POST   /api/v1/users              # Create user
GET    /api/v1/users/:id          # Get user by ID
PUT    /api/v1/users/:id          # Update user
PATCH  /api/v1/users/:id/status   # Activate/deactivate user
DELETE /api/v1/users/:id          # Soft delete user
```

#### Financial Records (Admin: full, Analyst: read-only)
```
GET    /api/v1/records            # List records (filterable)
POST   /api/v1/records            # Create record
GET    /api/v1/records/:id        # Get record by ID
PUT    /api/v1/records/:id        # Update record
DELETE /api/v1/records/:id        # Soft delete record
PATCH  /api/v1/records/:id/recover # Restore deleted record
```

**Query Parameters for listing:**
- `page`, `limit` - Pagination
- `type` - INCOME or EXPENSE
- `category` - Filter by category
- `startDate`, `endDate` - Date range
- `minAmount`, `maxAmount` - Amount range
- `search` - Search in description
- `state` - active, deleted, or all (admin only)
- `sortBy`, `sortOrder` - Sorting

#### Dashboard (All authenticated users)
```
GET /api/v1/dashboard/overview     # Total income, expenses, net balance
GET /api/v1/dashboard/insights     # Top categories, savings rate, etc.
GET /api/v1/dashboard/categories   # Category breakdown with percentages
GET /api/v1/dashboard/trends       # Monthly income vs expense trends
GET /api/v1/dashboard/recent       # Recent activity
GET /api/v1/dashboard/comparison   # Month-over-month comparison
```

#### Audit Logs (Admin only)
```
GET /api/v1/audit                  # View audit trail
```

---

## 🧪 Testing

```bash
npm test                    # Run all tests
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:coverage       # Generate coverage report
```

**Test Coverage:**
- Auth middleware tests
- Record service tests
- User service tests
- Dashboard service tests
- Record routes integration tests

---

## 🛡️ Security Features

| Feature | Implementation |
|---------|----------------|
| **Password Hashing** | bcrypt with 12 salt rounds |
| **JWT Authentication** | RS256, configurable expiry, issuer/audience validation |
| **Rate Limiting** | 100 req/15min general, 20 req/15min for auth |
| **Input Validation** | Joi schemas on all inputs |
| **UUID Validation** | All route params validated |
| **SQL Injection Prevention** | Prisma ORM parameterized queries |
| **CORS** | Configurable allowed origins |
| **Helmet** | Security headers |
| **Soft Delete** | Data preserved, not destroyed |
| **Audit Trail** | Immutable logs of all changes |

---

## 🗄️ Database Schema

```prisma
User {
  id, name, email, passwordHash, role, status, timestamps
}

FinancialRecord {
  id, amount, type, category, date, description, isDeleted, createdBy, timestamps
}

AuditLog {
  id, action, entity, entityId, changes (JSON), performedBy, timestamp
}
```

**Indexes optimized for:**
- Filtering by type + date (trends)
- Category + type grouping (breakdown)
- Creator + deletion status (audit)

---

## 📁 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
DIRECT_URL=postgresql://user:pass@host:5432/db  # For migrations

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
JWT_ISSUER=financeflow-api
JWT_AUDIENCE=financeflow-client

# CORS (comma-separated)
CORS_ORIGIN=http://localhost:5173
```

---

## 🎯 Design Decisions & Assumptions

1. **Global Analytics**: Dashboard shows system-wide data, not user-scoped, as finance teams need the full picture.

2. **Soft Delete**: Records are never permanently deleted to maintain audit integrity.

3. **Two-Tier Auth**: 
   - Fast token-based auth for reads (no DB hit)
   - Fresh user validation for mutations (catches deactivated users)

4. **Transaction-Wrapped Audits**: Audit logs are written in the same transaction as the data change, ensuring consistency.

5. **Centralized Permissions**: Single source of truth in `permissions/index.js` makes RBAC changes easy.

6. **Self-Protection**: Admins cannot delete or deactivate their own accounts.

---

## 📄 Additional Documentation

- `ARCHITECTURE.md` - Detailed system design
- `backend/docs/API.md` - Offline API reference
- Swagger UI at `/api-docs` - Interactive documentation

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js 20+ |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT (jsonwebtoken) |
| Validation | Joi |
| Testing | Jest |
| Logging | Winston |
| Documentation | Swagger/OpenAPI |
| Security | Helmet, bcrypt, express-rate-limit |

---

## 📞 Contact

**Vaishnav Verma**  
Email: vermavaishnav70@gmail.com

---

*Built for Zorvyn FinTech Backend Developer Internship Assignment*
