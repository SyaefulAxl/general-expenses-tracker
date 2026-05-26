# General Expenses Tracker — Full Stack Project

## Project Overview
Full-stack General Expenses Tracker. Frontend is Angular 21, Backend is Java 21 + Spring Boot 3.4.6.

## Repository
**GitHub:** https://github.com/SyaefulAxl/general-expenses-tracker

## Live URL
**https://thai.expenses.syaefulaz.my.id/**
- `expenses.syaefulaz.my.id` → redirects to `thai.expenses.syaefulaz.my.id` (DNS A record needed)

## Structure
```
/opt/general-expenses-tracker/
├── backend/              # Java 21 + Spring Boot 3.4.6
│   ├── pom.xml           # Maven parent (multi-module)
│   └── thai-expenses-api/  # API module
│       ├── pom.xml
│       └── src/main/java/com/texcoms/expenses/
├── frontend/             # Angular 21 standalone
│   ├── src/app/
│   │   ├── core/        # Services, guards, interceptors, models
│   │   ├── features/    # Dashboard, Expenses, Loans, History, Admin, Login
│   │   └── shared/      # Reusable components
│   ├── dist/            # Production build output
│   └── package.json
├── prototype/           # React/JSX design mockup (reference)
│   ├── app.jsx, dashboard.jsx, expenses.jsx, loans.jsx
│   ├── uploads/         # Sample attachments
│   └── screenshots/
└── uploads/             # Uploaded receipts/attachments
```

## Backend
- **Port:** 8081 (currently running)
- **JAVA_HOME:** `/usr/lib/jvm/java-21-openjdk-amd64`
- **Run:** `cd /opt/general-expenses-tracker/backend && mvn spring-boot:run -pl thai-expenses-api`
- **JAR:** `backend/thai-expenses-api/target/thai-expenses-api-1.0.0-SNAPSHOT.jar`
- **Base package:** `com.texcoms.expenses`
- **Tables:** `gen_users`, `gen_expenses`, `gen_loans`, `gen_repayments`
- **Credentials:** `syaeful@texcoms.my.id` / `Texcoms@2025!`
- **API:** `/api/v1/auth/login`, `/api/v1/expenses`, `/api/v1/loans`, `/api/v1/repayments`, `/api/v1/users`
- **Swagger:** `/swagger-ui.html`

## Database
- **Host:** `mysql-dbas-jkt-001.sumobase.my.id:63306`
- **Database:** `db792db21545168bc7`
- **SumoBase DBaaS:** Adds `username`, `password_hash`, `full_name` columns via triggers
  - Columns are pre-stabilized as `VARCHAR(255) DEFAULT '' NOT NULL`
  - If INSERT fails after table creation, run: `UPDATE gen_X SET username='' WHERE username IS NULL` then `ALTER TABLE gen_X MODIFY COLUMN username VARCHAR(255) DEFAULT '' NOT NULL`

## Frontend
- **Angular 21** standalone, PrimeNG v21, Tailwind CSS v4
- **Build:** `cd frontend && npx ng build --configuration=production`
- **Output:** `frontend/dist/general-expenses-frontend/browser/`
- **nginx serves:** `/opt/general-expenses-tracker/frontend/dist/general-expenses-frontend/browser`

## nginx
- **Config:** `/etc/nginx/sites-enabled/thai.expenses.syaefulaz.my.id.conf`
- **Proxy:** `/api/*` → `http://localhost:8081`
- **Reload:** `sudo nginx -s reload`

## Important Constraints
- No `any` types in TypeScript
- Angular standalone only (no NgModule)
- All API responses: `ApiResponse<T>` — `{success, message, data, timestamp}`
- MySQL password: `Texcoms@2025!`
