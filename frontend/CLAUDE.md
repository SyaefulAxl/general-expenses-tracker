# General Expenses Tracker — Full Stack Project

## Project Overview
Thailand / General Expenses Tracker web app. Frontend is Angular 21, Backend is Java 21 + Spring Boot 3.4.6.

## Current Status
- **Frontend**: Angular 21 standalone app deployed at `https://thai.expenses.syaefulaz.my.id/`
- **Backend**: Scaffold only, not yet running
- **Database**: MySQL at `mysql-dbas-jkt-001.sumobase.my.id:63306`, database `db792db21545168bc7`

## Frontend (`/opt/thai-expenses-frontend`)
- Angular 21 standalone, PrimeNG v21, Tailwind CSS v4
- Key files:
  - `src/app/app.ts` — root app shell with hamburger menu
  - `src/app/app.config.ts` — providers (NO provideZoneChangeDetection — causes NG0908)
  - `src/app/shared/components/sidebar/` — sidebar with mobile hamburger support
  - `src/app/features/dashboard/`, `expenses/`, `loans/`, `history/`, `admin/`
  - `src/app/core/services/` — expense, loan, auth, user services
  - `src/app/core/interceptors/` — jwt.interceptor
  - `src/app/core/models/` — User, Expense, Loan, Repayment interfaces
- Build: `cd /opt/thai-expenses-frontend && npx ng build --configuration=production`
- Deploy path: `/opt/thai-expenses-frontend/dist/thai-expenses-frontend/browser/`
- nginx serves from same path above
- nginx proxy: `/api/*` → `http://localhost:8080`
- Frontend uses `/api/v1` (relative, works behind nginx)

## Backend (`/opt/thai-expenses-backend`)
- Java 21 + Spring Boot 3.4.6, Maven multi-module
- Base package: `com.texcoms.expenses`
- Port: 8080
- JAVA_HOME: `/usr/lib/jvm/java-21-openjdk-amd64`
- Entities exist: User, Expense, Loan, Repayment
- Enums exist: UserRole, ExpenseStatus, LoanStatus
- application.properties exists with MySQL config
- Build: `cd /opt/thai-expenses-backend && mvn clean package -pl thai-expenses-api`
- Run: `mvn spring-boot:run -pl thai-expenses-api` (from backend root)

## Database
- Host: `mysql-dbas-jkt-001.sumobase.my.id:63306`
- Database: `db792db21545168bc7`
- Tables: users, expenses, loans, repayments (already created)
- Users seeded: Syaeful/ADMIN, Winda/MEMBER, Dina/MEMBER

## Backend Requirements
1. REST API with `ApiResponse<T>` wrapper: `{success, message, data, timestamp}`
2. Endpoints: `/api/v1/auth/login`, `/api/v1/expenses`, `/api/v1/loans`, `/api/v1/repayments`, `/api/v1/users`
3. JWT auth (jjwt 0.12.5) on all `/api/v1/*` except login
4. CORS for all origins
5. BCrypt password encoding
6. Role-based: ADMIN can manage users, MEMBER can only manage own data
7. API docs at `/swagger-ui.html` (springdoc-openapi 2.6.0)

## Frontend Issues to Fix
1. Mobile hamburger menu — needs verification it works on real mobile
2. Re-enable `apiResponseInterceptor` once backend is running
3. Dark mode CSS on all components

## Important Constraints
- No `any` types in TypeScript
- Angular standalone only (no NgModule)
- MySQL password: `Texcoms@2025!`
- nginx config: `/etc/nginx/sites-enabled/thai.expenses.syaefulaz.my.id.conf`
