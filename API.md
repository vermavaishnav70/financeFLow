# FinanceFlow API Reference

_Note: This is an offline summary. For the interactive Swagger UI, start the server and visit `http://localhost:3000/api-docs`._

## Authentication
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. Auth

### POST `/api/v1/auth/register`
- **Body**: `{ name, email, password }`
- **Role**: Public
- **Returns**: `{ user, token }`

### POST `/api/v1/auth/login`
- **Body**: `{ email, password }`
- **Role**: Public
- **Returns**: `{ user, token }`

---

## 2. Users

### GET `/api/v1/users/me`
- **Role**: ANY
- **Returns**: `User`

### PATCH `/api/v1/users/me/password`
- **Body**: `{ currentPassword, newPassword }`
- **Role**: ANY (authenticated)
- **Returns**: `{ message: 'Password updated successfully' }`
- **Errors**: 401 if current password is incorrect

### POST `/api/v1/users`
- **Body**: `{ name, email, password, role?, status? }`
- **Role**: ADMIN
- **Returns**: `User`

### GET `/api/v1/users`
- **Query**: `?page=1&limit=20&role=VIEWER&status=ACTIVE`
- **Role**: ADMIN
- **Returns**: `[User]` (paginated)

### GET `/api/v1/users/:id`
- **Role**: ADMIN
- **Returns**: `User`

### PUT `/api/v1/users/:id`
- **Body**: `{ name, email, role }`
- **Role**: ADMIN

### PATCH `/api/v1/users/:id/status`
- **Body**: `{ status: 'ACTIVE' | 'INACTIVE' }`
- **Role**: ADMIN
- **Use for recovery**: Set `status` back to `ACTIVE` to restore a deactivated user

### DELETE `/api/v1/users/:id`
- **Role**: ADMIN
- **Returns**: Soft Deletes the user.

---

## 2.5 Audit

### GET `/api/v1/audit`
- **Query**: `?page=1&limit=20&entity=user&action=UPDATE&entityId=...`
- **Role**: ADMIN
- **Returns**: paginated audit log entries with performer details

---

## 3. Financial Records

### POST `/api/v1/records`
- **Body**: `{ amount: 100.50, type: 'INCOME', category: 'Salary', date: '2026-01-01', description: '' }`
- **Role**: ADMIN

### GET `/api/v1/records`
- **Query**: `?page=1&limit=20&state=active&type=INCOME&category=Salary&startDate=...&endDate=...&minAmount=100&maxAmount=5000&search=...&sortBy=date&sortOrder=desc`
- **Role**: ADMIN or ANALYST
- **Notes**: `state=deleted` and `state=all` are admin-only. Response includes pagination metadata in `meta`.

### GET `/api/v1/records/:id`
- **Role**: ADMIN or ANALYST

### PUT `/api/v1/records/:id`
- **Body**: `{ amount, type, category, date, description }`
- **Role**: ADMIN

### DELETE `/api/v1/records/:id`
- **Role**: ADMIN
- **Returns**: Soft deletes the record.

### PATCH `/api/v1/records/:id/recover`
- **Role**: ADMIN
- **Returns**: Restores a soft-deleted record.

---

## 4. Dashboard (Analytics)
**Roles**: VIEWER, ANALYST, ADMIN

### GET `/api/v1/dashboard/overview`
- **Returns**: `{ totalIncome, totalExpenses, netBalance, totalRecords, incomeCount, expenseCount }`

### GET `/api/v1/dashboard/insights`
- **Returns**: `{ topExpenseCategory, topIncomeCategory, largestExpense, averageRecordAmount, savingsRate }`

### GET `/api/v1/dashboard/categories`
- **Query**: `?type=INCOME` (optional)
- **Returns**: Array of `{ category, type, total, count, percentage }`

### GET `/api/v1/dashboard/trends`
- **Query**: `?months=12`
- **Returns**: Array of `{ month: '2025-10', income, expense, net, ... }`

### GET `/api/v1/dashboard/comparison`
- **Returns**: `current month` vs `previous month` percentage changes per type.

### GET `/api/v1/dashboard/recent`
- **Role**: ALL (including VIEWER)
- **Returns**: 10 most recent records across the whole system.

## 5. Role Model

### VIEWER
- Can view dashboard summaries and recent activity
- Cannot access financial records or user management

### ANALYST
- Can view dashboard summaries and insights
- Can view all financial records
- Cannot create, update, delete records, or manage users

### ADMIN
- Can access dashboards
- Can create, update, and delete financial records
- Can create and manage users, roles, and statuses
