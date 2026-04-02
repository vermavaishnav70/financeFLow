# FinanceFlow Project Context

This file serves as the portable "source of truth" and context briefing document.
If you are an AI assistant or a new developer joining the project, read this first.

## Project Summary
FinanceFlow is a backend system designed for a multi-user finance dashboard. 
It ingests financial transactions (income/expenses) and serves aggregated data (totals, trends, category breakdowns, period comparisons) to analytics consumers.

## Technical Stack
- **Environment**: Node.js v20+, Express.js
- **Database**: PostgreSQL (currently hosted on Supabase)
- **Data Access**: Prisma ORM (v6+)
- **Security/Auth**: JWT (`jsonwebtoken`) + bcrypt-hashed passwords.
- **Validation**: Joi
- **Tooling**: Jest, Supertest, Winston for logging, Swagger for docs.

## Business Logic Highlights
1. **Roles**:
   - `VIEWER`: Read-only, scoped exclusively to their own records.
   - `ANALYST`: Read-only + Analytics. Can view dashboard summaries of the whole system, but can only read individual records they created.
   - `ADMIN`: Full system CRUD on both users and records.

2. **Audit Trails**:
   - We enforce strict audit logs. Any `CREATE`, `UPDATE`, or `DELETE` action on users or records is written to the `audit_logs` table.
   - We use Prisma `$transaction` blocks to guarantee atomicity. If an audit log write fails, the parent mutation rolls back.

3. **Soft Deletion**:
   - Financial records are never hard-deleted. We use an `is_deleted` boolean flag.

4. **Dashboard Scope**:
   - Dashboard aggregations evaluate *system-wide* data (excluding deleted records). For example, an `ANALYST` calling `/api/v1/dashboard/trends` retrieves sums of *every user's* transactions to see overall company metrics.

## Future / Project Ideas
- **Tagging System**: Add a M-to-M relationship for tags on records for more granular categorization.
- **Reporting Export**: Add endpoints to generate CSV/PDF exports.
- **Multi-tenant Organizations**: Currently single-tenant. Could be expanded so analysts only see data within their `team_id` or `org_id`.
