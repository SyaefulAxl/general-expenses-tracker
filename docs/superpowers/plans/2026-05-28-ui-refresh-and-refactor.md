# UI Refresh & Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the General Expenses Tracker to "modern fintech minimal" — Mercury/Brex/Linear-money — with consolidated CSS tokens, no inline hex colors, the three giant components split into focused sub-components, mobile login overflow fixed, plus a functional QA pass against the live API.

**Architecture:** Token-first sweep then route-by-route polish then component splits. Each phase ends in a build + screenshot verification before the next begins. Backend QA + bug-fix pass runs in parallel with frontend work where there's no contention.

**Tech Stack:** Angular 21 standalone + PrimeNG 21 + Tailwind v4 (frontend) · Spring Boot 3.4.6 + Java 21 + MySQL (backend) · JetBrains Mono subset for numerics.

**Spec:** [`docs/superpowers/specs/2026-05-28-ui-refresh-design.md`](../specs/2026-05-28-ui-refresh-design.md)

**Repository state at plan start:**
- Branch: `main`, ahead of `origin/main` by 1 commit (security commit pushed already)
- Large uncommitted frontend refactor present that builds cleanly
- Backend with new auth checks deployed via fixed systemd unit
- `frontend/dist/` was just rebuilt today

---

## File Structure

### Frontend — files modified

| Path | What changes |
|---|---|
| `src/styles.css` | Full rewrite of `:root` tokens; add `.num` utility; remove legacy aliases |
| `angular.json` | (Optional) preload JetBrains Mono subset stylesheet |
| `src/index.html` | Add `<link>` for JetBrains Mono Google Fonts subset OR self-host woff2 |
| `src/app/core/utils/currency.utils.ts` | (No code change needed unless we add `fmt` helpers; revisit Phase 4) |
| `src/app/features/login/login.component.ts` | Mobile overflow fix, emoji removal, rate-chip cleanup |
| `src/app/features/dashboard/dashboard.component.ts` | Emoji → PrimeIcons, net-position strip, `.num` class, token sweep |
| `src/app/features/loans/loans.component.ts` | Token sweep, kill `any`, emoji audit |
| `src/app/features/expenses/expenses.component.ts` | Reduce to page shell (~200 lines), token sweep |
| `src/app/features/history/history.component.ts` | Reduce to page shell (~250 lines), token sweep, fix NG8102 |
| `src/app/features/admin/admin.component.ts` | Reduce to page shell (~150 lines), token sweep |
| `src/app/shared/components/sidebar/sidebar.component.ts` | Token sweep, remove emoji bullets |
| `src/app/shared/components/topbar/topbar.component.ts` | Token sweep |
| `src/app/shared/components/kpi-card/kpi-card.component.ts` | Token sweep + PrimeIcon support |
| `src/app/shared/components/status-badge/status-badge.component.ts` | Token sweep |
| `src/app/shared/components/avatar/avatar.component.ts` | Token sweep |
| `src/app/shared/components/empty-state/empty-state.component.ts` | Token sweep |
| `src/app/shared/components/progress-bar/progress-bar.component.ts` | Token sweep |
| `src/app/shared/components/loading/loading.component.ts` | Token sweep |

### Frontend — files created

| Path | Purpose |
|---|---|
| `src/app/features/expenses/expense-filters.component.ts` | Filter bar (date range, status, source, category) — ~80 lines |
| `src/app/features/expenses/expense-list.component.ts` | Table/rows + actions — ~250 lines |
| `src/app/features/expenses/expense-form.component.ts` | Create/edit modal — ~250 lines |
| `src/app/features/history/history-filters.component.ts` | History filters — ~80 lines |
| `src/app/features/history/history-timeline.component.ts` | Grouped-by-date timeline list — ~300 lines |
| `src/app/features/history/history-detail.component.ts` | Right-side detail panel — ~200 lines |
| `src/app/features/admin/admin-users-table.component.ts` | User list table — ~250 lines |
| `src/app/features/admin/admin-user-form.component.ts` | User create/edit modal — ~150 lines |

### Backend — audit & fix (no new files unless a bug demands one)

| Area | What gets reviewed |
|---|---|
| `controller/ExpenseController.java` | Pagination defaults, error responses, /all admin guard already present |
| `controller/LoanController.java` | Pagination, `/all` admin guard (added today), repayment endpoint |
| `controller/RepaymentController.java` | Read endpoints, admin guard on `/all` |
| `controller/UserController.java` | ADMIN-only enforcement on user mgmt |
| `controller/AuthController.java` | Login response shape, JWT TTL |
| `service/LoanService.java` | Repayment math, settlement state transitions, soft-delete |
| `service/ExpenseService.java` | Soft-delete semantics, approval state machine |
| `service/AuthService.java` | Password hashing, login |
| `config/SumoBaseInitRunner.java` | Idempotency of schema-stabilization |
| `exception/GlobalExceptionHandler.java` | All exception types covered, status codes correct |

---

## Phase 0 — Baseline + Backend QA

### Task 0.1: Commit the in-progress frontend refactor as a checkpoint

**Files:** Many — see `git status` for the list.

- [ ] **Step 1:** Stage everything currently modified in `frontend/` plus the backend `target/` exclusions (per .gitignore those should already be excluded; verify with `git status`).

```bash
cd /opt/general-expenses-tracker
git status --short
```

- [ ] **Step 2:** Stage only the source files (avoid `target/` even if leaking through):

```bash
git add frontend/ backend/thai-expenses-api/src/
```

- [ ] **Step 3:** Verify what's staged:

```bash
git status --short
git diff --cached --stat
```

- [ ] **Step 4:** Commit:

```bash
git commit -m "$(cat <<'EOF'
checkpoint: WIP frontend refactor + backend auth hardening

Frontend: large refactor across login/dashboard/expenses/loans/
history/admin components and shared/. Build passes.
Backend: owner-or-ADMIN auth checks on loans + expenses, plus
ADMIN-only on /loans/all, expense reject, expense approve.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5:** Confirm tree is clean:

```bash
git status
```

### Task 0.2: Functional smoke test against live API

**Files:** none modified.

- [ ] **Step 1:** Log in as `syaeful` and capture JWT (run interactively, paste password yourself — do NOT bake into command):

```bash
read -s -p "Password for syaeful: " PW
TOKEN=$(curl -sS -X POST https://thai.expenses.syaefulaz.my.id/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"syaeful\",\"password\":\"$PW\"}" | jq -r .data.token)
unset PW
echo "Token length: ${#TOKEN}"
```

Expected: `Token length: ~200+` (JWT)

- [ ] **Step 2:** Smoke-test each route + verify shape:

```bash
H="Authorization: Bearer $TOKEN"
echo "--- expenses ---"   ; curl -sS -H "$H" https://thai.expenses.syaefulaz.my.id/api/v1/expenses | jq '.success, (.data | length)'
echo "--- expenses/all ---" ; curl -sS -H "$H" https://thai.expenses.syaefulaz.my.id/api/v1/expenses/all | jq '.success, (.data | length)'
echo "--- loans ---"      ; curl -sS -H "$H" https://thai.expenses.syaefulaz.my.id/api/v1/loans | jq '.success, (.data | length)'
echo "--- loans/all ---"  ; curl -sS -H "$H" https://thai.expenses.syaefulaz.my.id/api/v1/loans/all | jq '.success, (.data | length)'
echo "--- repayments ---" ; curl -sS -H "$H" https://thai.expenses.syaefulaz.my.id/api/v1/repayments | jq '.success, (.data | length)'
echo "--- users ---"      ; curl -sS -H "$H" https://thai.expenses.syaefulaz.my.id/api/v1/users | jq '.success, (.data | length)'
```

Expected: each returns `true` and a number ≥ 0.

- [ ] **Step 3:** Test a member account (winda) — should NOT be able to hit `/loans/all` or `/expenses/all`:

```bash
read -s -p "Password for winda: " PW
WINDA=$(curl -sS -X POST https://thai.expenses.syaefulaz.my.id/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"winda\",\"password\":\"$PW\"}" | jq -r .data.token)
unset PW
curl -sS -o /dev/null -w "winda /loans/all: %{http_code}\n"    -H "Authorization: Bearer $WINDA" https://thai.expenses.syaefulaz.my.id/api/v1/loans/all
curl -sS -o /dev/null -w "winda /expenses/all: %{http_code}\n" -H "Authorization: Bearer $WINDA" https://thai.expenses.syaefulaz.my.id/api/v1/expenses/all
curl -sS -o /dev/null -w "winda /repayments/all: %{http_code}\n" -H "Authorization: Bearer $WINDA" https://thai.expenses.syaefulaz.my.id/api/v1/repayments/all
```

Expected: all three return `403`.

- [ ] **Step 4:** Record results to `/tmp/qa-baseline.txt`. If anything is broken, log a bug to fix in Phase 0.3.

### Task 0.3: Backend audit pass

**Files:** review-only for now; fixes happen as separate sub-tasks if bugs found.

- [ ] **Step 1:** Read each service file and look for:
  - Methods that touch a user's data without checking `requester` (skipped today on Loan; might be others)
  - Soft-delete predicates missing on read endpoints
  - State-machine transitions that allow illegal moves (e.g. APPROVED → DRAFT)
  - Money math that uses `double` instead of `BigDecimal` (none expected, verify)

```bash
cd /opt/general-expenses-tracker/backend/thai-expenses-api
grep -nE "double |float " src/main/java/com/texcoms/expenses/service/*.java src/main/java/com/texcoms/expenses/entity/*.java
grep -nE "findAll\(\)|findById\(" src/main/java/com/texcoms/expenses/service/*.java | grep -v "Active\|IsDeletedFalse"
```

- [ ] **Step 2:** Check `RepaymentController`:

```bash
grep -n "@PreAuthorize\|UserDetails\|requester" src/main/java/com/texcoms/expenses/controller/RepaymentController.java
```

Expected: `/all` already has `@PreAuthorize("hasRole('ADMIN')")`.

- [ ] **Step 3:** Check `UserController`:

```bash
grep -n "@PreAuthorize\|PostMapping\|PutMapping\|DeleteMapping" src/main/java/com/texcoms/expenses/controller/UserController.java
```

Expected: every write endpoint has `@PreAuthorize("hasRole('ADMIN')")`. If any are missing, add them and commit `fix(security): require ADMIN for ...`.

- [ ] **Step 4:** Confirm `GlobalExceptionHandler` handles `ResourceNotFoundException`, `AccessDeniedException`, `BadCredentialsException`, `MethodArgumentNotValidException`, `Exception` (generic 500):

```bash
grep -n "@ExceptionHandler" src/main/java/com/texcoms/expenses/exception/GlobalExceptionHandler.java
```

If any are missing, add. If found a bug, fix and commit before Phase 1.

- [ ] **Step 5:** If any backend fix was made, rebuild and restart:

```bash
cd /opt/general-expenses-tracker/backend
mvn -q package -pl thai-expenses-api -DskipTests
sudo systemctl restart thai-expenses-backend
sleep 8
systemctl is-active thai-expenses-backend
```

Expected: `active`.

---

## Phase 1 — Token Sweep

### Task 1.1: Rewrite `styles.css` `:root` block with final tokens

**Files:**
- Modify: `frontend/src/styles.css` (block starting at line ~20, `:root {`)

- [ ] **Step 1:** Read current `:root` (lines 20–~120) to know the full surface to replace.

```bash
sed -n '20,140p' /opt/general-expenses-tracker/frontend/src/styles.css
```

- [ ] **Step 2:** Replace the entire `:root { ... }` block with:

```css
:root {
  /* ── Layout ───────────────────────────────────────────────── */
  --sidebar-width:  260px;
  --topbar-height:  56px;
  --space-section:  28px;

  /* ── Brand ────────────────────────────────────────────────── */
  --accent:        #2563eb;
  --accent-hover:  #1d4ed8;
  --accent-soft:   #eff6ff;

  /* ── Surfaces ─────────────────────────────────────────────── */
  --surface:        #ffffff;
  --surface-muted:  #f8fafc;
  --surface-sunken: #f1f5f9;

  /* ── Borders ──────────────────────────────────────────────── */
  --border:        #e5e7eb;
  --border-strong: #d1d5db;

  /* ── Text ─────────────────────────────────────────────────── */
  --text:        #0f172a;
  --text-muted:  #475569;
  --text-subtle: #64748b;
  --text-faint:  #94a3b8;

  /* ── Semantic ─────────────────────────────────────────────── */
  --success:      #059669;
  --success-soft: #f0fdf4;
  --warning:      #d97706;
  --warning-soft: #fffbeb;
  --danger:       #dc2626;
  --danger-soft:  #fef2f2;
  --info:         #0891b2;
  --info-soft:    #ecfeff;

  /* ── Sidebar ──────────────────────────────────────────────── */
  --sidebar-bg:          #0f172a;
  --sidebar-border:      rgba(255,255,255,0.06);
  --sidebar-text:        #94a3b8;
  --sidebar-hover-bg:    rgba(255,255,255,0.05);
  --sidebar-text-hover:  #e2e8f0;
  --sidebar-active-bg:   rgba(96,165,250,0.15);
  --sidebar-text-active: #60a5fa;

  /* ── Typography ───────────────────────────────────────────── */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  --fs-xs:   0.72rem;
  --fs-sm:   0.85rem;
  --fs-base: 0.95rem;
  --fs-lg:   1.05rem;
  --fs-xl:   1.6rem;
  --fs-2xl:  2.4rem;

  /* ── Shadows ──────────────────────────────────────────────── */
  --shadow-sm: 0 1px 2px rgba(15,23,42,0.06);
  --shadow:    0 1px 4px rgba(15,23,42,0.08), 0 0 0 1px rgba(15,23,42,0.04);
  --shadow-md: 0 4px 12px rgba(15,23,42,0.10);
  --shadow-lg: 0 8px 24px rgba(15,23,42,0.14);

  /* ── Radii ────────────────────────────────────────────────── */
  --radius-sm: 6px;
  --radius:    10px;
  --radius-lg: 16px;
}
```

- [ ] **Step 3:** Build to see what breaks:

```bash
cd /opt/general-expenses-tracker/frontend && timeout 120 npx ng build --configuration=production 2>&1 | tail -30
```

Expected: build succeeds. Sass/CSS doesn't fail compilation on missing tokens, so any reference to a deleted alias just renders as nothing — visual bugs will show in QA.

### Task 1.2: Add JetBrains Mono + `.num` utility

**Files:**
- Modify: `frontend/src/index.html` (head)
- Modify: `frontend/src/styles.css` (append utility)

- [ ] **Step 1:** In `frontend/src/index.html`, add the Google Fonts JetBrains Mono link in `<head>`. Use the existing Inter pattern as a model. The token range needed is digits + currency symbols + dots/commas/spaces:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700&display=swap&text=0123456789.,%20%E0%B8%BF%24Rp+%E2%88%92" rel="stylesheet">
```

- [ ] **Step 2:** Append the `.num` utility to `frontend/src/styles.css`:

```css
/* ── Money / numeric values ───────────────────────────────── */
.num {
  font-family: var(--font-mono);
  font-feature-settings: 'tnum' 1, 'cv11' 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
.num-pos { color: var(--success); }
.num-neg { color: var(--danger); }
```

- [ ] **Step 3:** Build:

```bash
cd /opt/general-expenses-tracker/frontend && npx ng build --configuration=production 2>&1 | tail -10
```

Expected: build succeeds; bundle grows slightly.

### Task 1.3: Sweep legacy aliases across the codebase

**Files:** mechanical replacement across many.

- [ ] **Step 1:** List every legacy alias usage:

```bash
cd /opt/general-expenses-tracker/frontend
grep -rn -E "var\(--(bg-page|bg-primary|bg-secondary|bg-card|bg-hover|bg-tertiary|border-color|border-subtle|border-light|surface-card|text-900|text-700|text-500|text-400|primary|primary-hover|primary-light|primary-border|success-light|success-border|warning-light|warning-border|danger|danger-light|danger-border|purple|purple-light|accent-primary|accent-primary-subtle|accent-success|accent-success-subtle|accent-warning|accent-warning-subtle|accent-danger|accent-danger-subtle|topbar-bg|sidebar-w|topbar-h|radius)\)" src/
```

- [ ] **Step 2:** Replacement table (apply in this order — global sed):

| From | To |
|---|---|
| `var(--bg-page)` | `var(--surface-muted)` |
| `var(--bg-primary)` | `var(--surface-muted)` |
| `var(--bg-secondary)` | `var(--surface)` |
| `var(--bg-card)` | `var(--surface)` |
| `var(--bg-tertiary)` | `var(--surface-muted)` |
| `var(--bg-hover)` | `var(--surface-sunken)` |
| `var(--surface-card)` | `var(--surface)` |
| `var(--topbar-bg)` | `var(--surface)` |
| `var(--border-color)` | `var(--border)` |
| `var(--border-subtle)` | `var(--surface-sunken)` |
| `var(--border-light)` | `var(--surface-sunken)` |
| `var(--text-900)` | `var(--text)` |
| `var(--text-700)` | `var(--text-muted)` |
| `var(--text-500)` | `var(--text-subtle)` |
| `var(--text-400)` | `var(--text-faint)` |
| `var(--primary)` | `var(--accent)` |
| `var(--primary-hover)` | `var(--accent-hover)` |
| `var(--primary-light)` | `var(--accent-soft)` |
| `var(--primary-border)` | `var(--border-strong)` |
| `var(--accent-primary)` | `var(--accent)` |
| `var(--accent-primary-subtle)` | `var(--accent-soft)` |
| `var(--accent-success)` | `var(--success)` |
| `var(--accent-success-subtle)` | `var(--success-soft)` |
| `var(--accent-warning)` | `var(--warning)` |
| `var(--accent-warning-subtle)` | `var(--warning-soft)` |
| `var(--accent-danger)` | `var(--danger)` |
| `var(--accent-danger-subtle)` | `var(--danger-soft)` |
| `var(--success-light)` | `var(--success-soft)` |
| `var(--success-border)` | `var(--success)` |
| `var(--warning-light)` | `var(--warning-soft)` |
| `var(--warning-border)` | `var(--warning)` |
| `var(--danger-light)` | `var(--danger-soft)` |
| `var(--danger-border)` | `var(--danger)` |
| `var(--purple)` | `var(--accent)` |
| `var(--purple-light)` | `var(--accent-soft)` |
| `var(--sidebar-w)` | `var(--sidebar-width)` |
| `var(--topbar-h)` | `var(--topbar-height)` |
| `var(--radius-lg)` | `var(--radius-lg)` (unchanged but verify) |

Apply with a single sed script:

```bash
cd /opt/general-expenses-tracker/frontend
SCRIPT=$(mktemp)
cat > "$SCRIPT" <<'SED'
s|var(--bg-page)|var(--surface-muted)|g
s|var(--bg-primary)|var(--surface-muted)|g
s|var(--bg-secondary)|var(--surface)|g
s|var(--bg-card)|var(--surface)|g
s|var(--bg-tertiary)|var(--surface-muted)|g
s|var(--bg-hover)|var(--surface-sunken)|g
s|var(--surface-card)|var(--surface)|g
s|var(--topbar-bg)|var(--surface)|g
s|var(--border-color)|var(--border)|g
s|var(--border-subtle)|var(--surface-sunken)|g
s|var(--border-light)|var(--surface-sunken)|g
s|var(--text-900)|var(--text)|g
s|var(--text-700)|var(--text-muted)|g
s|var(--text-500)|var(--text-subtle)|g
s|var(--text-400)|var(--text-faint)|g
s|var(--primary-hover)|var(--accent-hover)|g
s|var(--primary-light)|var(--accent-soft)|g
s|var(--primary-border)|var(--border-strong)|g
s|var(--primary)|var(--accent)|g
s|var(--accent-primary-subtle)|var(--accent-soft)|g
s|var(--accent-primary)|var(--accent)|g
s|var(--accent-success-subtle)|var(--success-soft)|g
s|var(--accent-success)|var(--success)|g
s|var(--accent-warning-subtle)|var(--warning-soft)|g
s|var(--accent-warning)|var(--warning)|g
s|var(--accent-danger-subtle)|var(--danger-soft)|g
s|var(--accent-danger)|var(--danger)|g
s|var(--success-light)|var(--success-soft)|g
s|var(--success-border)|var(--success)|g
s|var(--warning-light)|var(--warning-soft)|g
s|var(--warning-border)|var(--warning)|g
s|var(--danger-light)|var(--danger-soft)|g
s|var(--danger-border)|var(--danger)|g
s|var(--purple-light)|var(--accent-soft)|g
s|var(--purple)|var(--accent)|g
s|var(--sidebar-w)|var(--sidebar-width)|g
s|var(--topbar-h)|var(--topbar-height)|g
SED

find src -type f \( -name '*.ts' -o -name '*.html' -o -name '*.css' \) \
  -exec sed -i -f "$SCRIPT" {} +
rm "$SCRIPT"
```

- [ ] **Step 3:** Verify no legacy alias remains:

```bash
grep -rnE "var\(--(bg-page|bg-primary|bg-secondary|bg-card|bg-hover|bg-tertiary|surface-card|topbar-bg|border-color|border-subtle|border-light|text-900|text-700|text-500|text-400|primary-hover|primary-light|primary-border|primary[^-]|accent-primary|accent-success|accent-warning|accent-danger|success-light|success-border|warning-light|warning-border|danger-light|danger-border|purple-light|purple[^-]|sidebar-w|topbar-h)\)" src/ || echo "CLEAN"
```

Expected: `CLEAN`.

- [ ] **Step 4:** Build and check for new warnings:

```bash
npx ng build --configuration=production 2>&1 | tail -20
```

Expected: build succeeds.

### Task 1.4: Commit token sweep

- [ ] **Step 1:**
```bash
cd /opt/general-expenses-tracker
git add frontend/
git status --short
```

- [ ] **Step 2:**
```bash
git commit -m "$(cat <<'EOF'
refactor(ui): consolidate CSS tokens, add JetBrains Mono for numerics

- Rewrite :root with 19 final tokens (was ~40 with legacy aliases)
- Drop all --bg-*, --text-NNN, --primary*, --success-*, etc. legacy aliases
- Add --font-mono + .num utility for tabular money rendering
- Mechanical sed pass replacing legacy aliases across .ts/.html/.css

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — Login mobile fix + emoji removal

### Task 2.1: Fix login mobile overflow + drop emoji bullets

**Files:**
- Modify: `frontend/src/app/features/login/login.component.ts`

- [ ] **Step 1:** Read the login component to find:
  - The quick-sign-in chip row (look for `quick-signin` or similar class)
  - The feature-list `<ul>` or div with emoji bullets

```bash
grep -nE "quick|emoji|✅|✔|🇹🇭|features-list|hero-features" /opt/general-expenses-tracker/frontend/src/app/features/login/login.component.ts
```

- [ ] **Step 2:** For each emoji `✅ Track expenses…` style line, replace the emoji with a small indigo dot `<span class="bullet"></span>` (define `.bullet { width:6px; height:6px; border-radius:999px; background:var(--accent); display:inline-block; }` in the component styles).

- [ ] **Step 3:** For the quick-sign-in row, ensure it has `flex-wrap: wrap; gap: 8px;` and each chip has `flex: 0 0 auto; min-width: 0;`. If the layout is `display: flex` on a row, add a media query `@media (max-width: 480px) { .quick-signin { flex-direction: column; } .quick-signin > * { width: 100%; } }`.

- [ ] **Step 4:** Drop the rate/balance chips from the hero left panel (the `฿119 · ฿6,098,683 IDR` chips). They're decorative + cramped + duplicate the dashboard rate bar.

- [ ] **Step 5:** Build:

```bash
cd /opt/general-expenses-tracker/frontend && npx ng build --configuration=production 2>&1 | tail -5
```

Expected: build succeeds.

### Task 2.2: Verify login at both viewports

- [ ] **Step 1:** Capture screenshots:

```bash
timeout 30 chromium-browser --headless=new --disable-gpu --hide-scrollbars --no-sandbox --window-size=1440,900 \
  --screenshot=$HOME/login-desktop-after.png https://thai.expenses.syaefulaz.my.id/ 2>/dev/null
timeout 30 chromium-browser --headless=new --disable-gpu --hide-scrollbars --no-sandbox --window-size=390,844 \
  --screenshot=$HOME/login-mobile-after.png https://thai.expenses.syaefulaz.my.id/ 2>/dev/null
```

Note: build must be deployed first — the dist folder is what nginx serves. If `ng build` succeeded, the new bundle is already at `frontend/dist/general-expenses-frontend/browser/` which nginx serves directly. No additional deploy step needed.

- [ ] **Step 2:** Open both screenshots in `Read` tool. Confirm:
  - Quick-sign-in chips no longer clip at 390px wide
  - Feature list bullets are dots, not emoji
  - No rate/balance chips in the hero left panel
  - Desktop layout still feels balanced

### Task 2.3: Commit

```bash
cd /opt/general-expenses-tracker
git add frontend/src/app/features/login/
git commit -m "$(cat <<'EOF'
fix(login): mobile overflow on quick-sign-in chips + drop emoji bullets

- Replace emoji bullets in the feature list with indigo dots
- flex-wrap + responsive stacking for quick-sign-in row
- Remove decorative rate/balance chips from the hero panel
  (duplicated dashboard rate bar, cramped at narrow widths)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Inline hex sweep

### Task 3.1: Map every inline hex usage

- [ ] **Step 1:**
```bash
cd /opt/general-expenses-tracker/frontend
grep -rn -E "\[style\.(color|background|border-color|borderColor|background-color|backgroundColor)\]=" src/app | tee /tmp/inline-hex.txt
grep -rn -E "style=\"(color|background)\s*:\s*#" src/app | tee -a /tmp/inline-hex.txt
wc -l /tmp/inline-hex.txt
```

- [ ] **Step 2:** Categorize each finding into:
  - **A) State-driven** (color depends on a runtime value like `pendingCount() > 0`) — convert to `[class]` driven by computed class name, or to `[style.color]="condition ? 'var(--success)' : 'var(--text)'"` (token var still in the inline style, not hex)
  - **B) Static** (the hex is constant) — convert to a utility class
  - **C) Data-driven** (color comes from a category/source map) — extract the map to a typed `categoryStyle()` function returning `{bg, fg}` keyed off enum/string, store the values as token vars not hex

### Task 3.2: Replace systematically per file

For each file in the list, apply this rule:

- [ ] **Step 1:** For category color maps like the one in `dashboard.component.ts:127`:
  ```ts
  // Before
  [style.background]="cat.bg"  // cat.bg = '#eff6ff'
  [style.color]="cat.fg"        // cat.fg = '#1d4ed8'
  ```
  Change the category model to use semantic-color tokens:
  ```ts
  // categoryStyle.ts (new helper)
  export const CATEGORY_STYLE: Record<string, { tone: 'accent' | 'warning' | 'success' | 'danger' | 'info' }> = {
    Transport:     { tone: 'accent' },
    Food:          { tone: 'warning' },
    Accommodation: { tone: 'info' },
    Entertainment: { tone: 'danger' },
    Other:         { tone: 'neutral' as const },
  };
  ```
  Then in template use class:
  ```html
  <div class="cat-icon-chip" [class]="'tone-' + cat.tone">
  ```
  And in styles.css define each tone:
  ```css
  .tone-accent  { background: var(--accent-soft);  color: var(--accent); }
  .tone-warning { background: var(--warning-soft); color: var(--warning); }
  ...
  ```

- [ ] **Step 2:** For boolean state colors:
  ```ts
  // Before
  [style.color]="pendingCount() > 0 ? '#d97706' : '#0f172a'"
  // After
  [class.text-warning]="pendingCount() > 0"
  ```
  With `.text-warning { color: var(--warning); }` in styles.css (or use Tailwind: `[class.text-warning]` works if we wire a token-aware Tailwind config; otherwise just declare the class).

- [ ] **Step 3:** Apply to all 32 sites. Run after each file:

```bash
grep -c "#[0-9a-fA-F]\{3,6\}" src/app/features/<file>.ts
```

- [ ] **Step 4:** Build:

```bash
npx ng build --configuration=production 2>&1 | tail -5
```

Expected: succeeds.

### Task 3.3: Verify no literal hex left in inline styles

- [ ] **Step 1:**

```bash
cd /opt/general-expenses-tracker/frontend
grep -rn -E "\[style\.[^]]*\]=\"[^\"]*#[0-9a-fA-F]{3,6}" src/app && echo "STILL HAS INLINE HEX" || echo "CLEAN"
grep -rn -E "style=\"[^\"]*#[0-9a-fA-F]{3,6}" src/app && echo "STILL HAS STATIC INLINE HEX" || echo "CLEAN"
```

Expected: both `CLEAN`.

### Task 3.4: Commit

```bash
git add frontend/
git commit -m "$(cat <<'EOF'
refactor(ui): strip inline hex colors, drive from tokens via classes

- Extract category color tones to CATEGORY_STYLE map keyed by semantic
  tone (accent/warning/success/danger/info)
- Replace [style.color] / [style.background] with class bindings
- Define .tone-* and .text-* utilities backed by --accent/--warning/...

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Dashboard polish

### Task 4.1: Swap emoji KPI icons for PrimeIcons

**Files:**
- Modify: `frontend/src/app/features/dashboard/dashboard.component.ts`

- [ ] **Step 1:** In the dashboard template, replace each emoji KPI icon:

| Card | Old | New |
|---|---|---|
| My Total Spend | `💰` | `<i class="pi pi-wallet"></i>` |
| Team Total | `👥` | `<i class="pi pi-users"></i>` |
| My Expenses | `📋` | `<i class="pi pi-list"></i>` |
| Pending | `⏳` | `<i class="pi pi-clock"></i>` |

Update the `.kpi-icon-wrap` class to size icons (`font-size: 1.4rem; color: var(--accent);` etc, per tone).

- [ ] **Step 2:** Rate bar header: replace `💱 Live Rates` with `Today's rates` (plain text, uppercase, muted).

- [ ] **Step 3:** Build + screenshot dashboard. (Requires login — capture via puppeteer-like flow OR skip live screenshot, just verify build.)

```bash
cd /opt/general-expenses-tracker/frontend && npx ng build --configuration=production 2>&1 | tail -5
```

### Task 4.2: Promote Net Position to a full-width strip

- [ ] **Step 1:** In the dashboard template, move the "Net Position" block out of the loan-summary card and place it as a full-width strip immediately under the KPI grid (above `.dash-grid`).

```html
<!-- Right after .kpi-grid, before .dash-grid -->
<div class="net-strip" [class.net-positive]="netPosition() >= 0" [class.net-negative]="netPosition() < 0">
  <div class="net-strip-left">
    <div class="net-strip-label">Net Position</div>
    <div class="net-strip-sub">Owed to you minus what you owe</div>
  </div>
  <div class="net-strip-right">
    <div class="net-strip-val num" [class.num-pos]="netPosition() >= 0" [class.num-neg]="netPosition() < 0">
      {{ netPosition() >= 0 ? '+' : '' }}{{ fmtThb(netPosition()) }}
    </div>
    <div class="net-strip-fx num">
      {{ fmtUsd(netPosition()) }} · {{ fmtIdr(netPosition()) }}
    </div>
  </div>
</div>
```

Add styles:
```css
.net-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-radius: var(--radius);
  margin-bottom: 24px;
  border: 1px solid var(--border);
  background: var(--surface);
}
.net-positive { border-left: 4px solid var(--success); }
.net-negative { border-left: 4px solid var(--danger); }
.net-strip-label { font-size: var(--fs-xs); font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.net-strip-sub   { font-size: var(--fs-sm); color: var(--text-subtle); margin-top: 2px; }
.net-strip-val   { font-size: var(--fs-2xl); font-weight: 700; }
.net-strip-fx    { font-size: var(--fs-sm); color: var(--text-subtle); margin-top: 2px; text-align: right; }
@media (max-width: 640px) {
  .net-strip { flex-direction: column; align-items: stretch; gap: 8px; }
  .net-strip-right { text-align: left; }
  .net-strip-fx { text-align: left; }
}
```

- [ ] **Step 2:** Remove the duplicate Net Position block from the loan-summary card.

### Task 4.3: Apply `.num` everywhere

- [ ] **Step 1:** Grep for amount renderings:

```bash
grep -n "fmtThb\|fmtUsd\|fmtIdr" /opt/general-expenses-tracker/frontend/src/app/features/dashboard/dashboard.component.ts | wc -l
```

- [ ] **Step 2:** Wrap each occurrence in `<span class="num">{{ fmt… }}</span>` OR add `class="num"` to the parent element. Don't double-wrap.

### Task 4.4: Build + commit

```bash
cd /opt/general-expenses-tracker/frontend && npx ng build --configuration=production 2>&1 | tail -10
git add frontend/src/app/features/dashboard/
git commit -m "$(cat <<'EOF'
feat(dashboard): minimal polish — PrimeIcons, net-position strip, mono numerics

- Replace 4 emoji KPI icons with PrimeIcons (wallet/users/list/clock)
- Drop emoji from "Live Rates" header
- Promote Net Position to full-width strip under KPIs
- All money amounts wrapped in .num for tabular monospaced rendering

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — Expenses split

### Task 5.1: Extract `ExpenseFiltersComponent`

**Files:**
- Create: `frontend/src/app/features/expenses/expense-filters.component.ts`
- Modify: `frontend/src/app/features/expenses/expenses.component.ts`

- [ ] **Step 1:** Read the parent component to identify the filter bar (look for `<div class="filter-bar">` or similar):

```bash
grep -nE "filter|p-select|p-datepicker" /opt/general-expenses-tracker/frontend/src/app/features/expenses/expenses.component.ts | head -30
```

- [ ] **Step 2:** Create the new component:

```ts
// frontend/src/app/features/expenses/expense-filters.component.ts
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';

export interface ExpenseFilters {
  search: string;
  status: string;
  category: string;
  source: string;
  dateFrom: Date | null;
  dateTo: Date | null;
}

@Component({
  selector: 'app-expense-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, DatePickerModule, InputTextModule],
  template: `
    <div class="filter-bar">
      <!-- COPY THE EXISTING FILTER MARKUP HERE from expenses.component.ts -->
    </div>
  `,
  styles: [`
    /* COPY filter-bar styles here */
  `],
})
export class ExpenseFiltersComponent {
  @Input() filters: ExpenseFilters = { search: '', status: 'ALL', category: 'ALL', source: 'ALL', dateFrom: null, dateTo: null };
  @Output() filtersChange = new EventEmitter<ExpenseFilters>();

  update<K extends keyof ExpenseFilters>(k: K, v: ExpenseFilters[K]): void {
    this.filters = { ...this.filters, [k]: v };
    this.filtersChange.emit(this.filters);
  }
}
```

- [ ] **Step 3:** Move the actual filter markup + styles from the parent into the child. Replace inside parent with:

```html
<app-expense-filters [filters]="filters()" (filtersChange)="onFiltersChange($event)" />
```

- [ ] **Step 4:** Add `ExpenseFiltersComponent` to the parent's `imports: [...]`.

- [ ] **Step 5:** Build:

```bash
cd /opt/general-expenses-tracker/frontend && npx ng build --configuration=production 2>&1 | tail -10
```

Expected: build succeeds. If TS errors point at typed `@Input()` shape, adjust the `ExpenseFilters` interface to match parent.

### Task 5.2: Extract `ExpenseListComponent`

**Files:**
- Create: `frontend/src/app/features/expenses/expense-list.component.ts`
- Modify: `frontend/src/app/features/expenses/expenses.component.ts`

- [ ] **Step 1:** Create the component with this skeleton:

```ts
// frontend/src/app/features/expenses/expense-list.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { Expense, ExpenseStatus, User } from '@core/models';
import { fmtThb, fmtUsd, fmtIdr, fmtDate } from '@core/utils/currency.utils';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, StatusBadgeComponent],
  template: `<!-- MOVE TABLE/ROW MARKUP HERE -->`,
  styles: [`/* MOVE TABLE/ROW STYLES HERE */`],
})
export class ExpenseListComponent {
  @Input({ required: true }) expenses: Expense[] = [];
  @Input({ required: true }) currentUser: User | null = null;
  @Input() isAdmin = false;
  @Output() edit = new EventEmitter<Expense>();
  @Output() delete = new EventEmitter<Expense>();
  @Output() approve = new EventEmitter<Expense>();
  @Output() reject = new EventEmitter<Expense>();
  protected fmtThb = fmtThb;
  protected fmtUsd = fmtUsd;
  protected fmtIdr = fmtIdr;
  protected fmtDate = fmtDate;
}
```

- [ ] **Step 2:** In the parent template:

```html
<app-expense-list
  [expenses]="filteredExpenses()"
  [currentUser]="currentUser()"
  [isAdmin]="isAdmin()"
  (edit)="openEdit($event)"
  (delete)="onDelete($event)"
  (approve)="onApprove($event)"
  (reject)="onReject($event)"
/>
```

- [ ] **Step 3:** Build + verify.

### Task 5.3: Extract `ExpenseFormComponent`

**Files:**
- Create: `frontend/src/app/features/expenses/expense-form.component.ts`
- Modify: `frontend/src/app/features/expenses/expenses.component.ts`

- [ ] **Step 1:** Create:

```ts
// frontend/src/app/features/expenses/expense-form.component.ts
import { Component, EventEmitter, Input, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { Expense, ExpenseStatus } from '@core/models';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule,
            InputNumberModule, SelectModule, DatePickerModule, CheckboxModule],
  template: `<!-- MOVE MODAL MARKUP HERE -->`,
  styles: [`/* MOVE MODAL STYLES HERE */`],
})
export class ExpenseFormComponent {
  @Input() open = false;
  @Input() editing: Expense | null = null;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<Partial<Expense>>();
  /* form signals here */
}
```

- [ ] **Step 2:** Parent:

```html
<app-expense-form
  [(open)]="formOpen"
  [editing]="editingExpense()"
  (save)="onSave($event)"
/>
```

- [ ] **Step 3:** Build.

### Task 5.4: Reduce parent to shell

- [ ] **Step 1:** After 5.1-5.3, the parent should contain only:
  - Imports for the three children
  - Top-of-page header (title, "New expense" button)
  - `<app-expense-filters>`
  - `<app-expense-list>`
  - `<app-expense-form>`
  - Signals for `filters`, `editingExpense`, `formOpen`, derived `filteredExpenses()`
  - Handlers `onFiltersChange / openEdit / onDelete / onApprove / onReject / onSave`

- [ ] **Step 2:** Confirm line count:

```bash
wc -l /opt/general-expenses-tracker/frontend/src/app/features/expenses/*.ts
```

Expected: parent ≤ 250 lines, each child ≤ 300 lines.

### Task 5.5: Commit

```bash
git add frontend/src/app/features/expenses/
git commit -m "$(cat <<'EOF'
refactor(expenses): split 817-line component into filters/list/form

- expense-filters.component.ts (~80 lines) — filter bar
- expense-list.component.ts (~250 lines) — table + row actions
- expense-form.component.ts (~250 lines) — create/edit modal
- expenses.component.ts reduced to page shell

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6 — History split

### Task 6.1-6.4: Mirror Phase 5 for History

**Files to create:**
- `frontend/src/app/features/history/history-filters.component.ts`
- `frontend/src/app/features/history/history-timeline.component.ts`
- `frontend/src/app/features/history/history-detail.component.ts`

- [ ] **Step 1:** Read parent, identify the three regions (filters / timeline / detail panel).

- [ ] **Step 2:** Create each child with the same `@Input()` + `@Output()` pattern as Phase 5. Don't share code with expenses; copy patterns but keep types local. (DRY says shared, YAGNI says it's only used twice.)

- [ ] **Step 3:** Fix the NG8102 warning at `history.component.ts:253` while we're in here:

```bash
grep -n "asExpense(selectedItem()!.data).category ?? '—'" /opt/general-expenses-tracker/frontend/src/app/features/history/history.component.ts
```

Remove the `?? '—'` since `category` is required on the model. Or change the asExpense return type to allow nullable category.

- [ ] **Step 4:** Build + commit:

```bash
cd /opt/general-expenses-tracker/frontend && npx ng build --configuration=production 2>&1 | tail -10
cd /opt/general-expenses-tracker
git add frontend/src/app/features/history/
git commit -m "refactor(history): split 877-line component + fix NG8102 nullish warning"
```

---

## Phase 7 — Admin split

### Task 7.1-7.4: Mirror for Admin (smaller)

**Files to create:**
- `frontend/src/app/features/admin/admin-users-table.component.ts`
- `frontend/src/app/features/admin/admin-user-form.component.ts`

- [ ] **Step 1:** Read parent, identify the table + the user create/edit modal.

- [ ] **Step 2:** Extract each. Pattern: parent owns the list signal, child receives `@Input() users: User[]`, emits edit/delete events.

- [ ] **Step 3:** Build + commit:

```bash
cd /opt/general-expenses-tracker/frontend && npx ng build --configuration=production 2>&1 | tail -10
cd /opt/general-expenses-tracker
git add frontend/src/app/features/admin/
git commit -m "refactor(admin): split 590-line component into users-table + user-form"
```

---

## Phase 8 — TS cleanup

### Task 8.1: Replace `any` in loans

- [ ] **Step 1:** Find it:

```bash
grep -n "\bany\b" /opt/general-expenses-tracker/frontend/src/app/features/loans/loans.component.ts
```

- [ ] **Step 2:** Replace with the concrete type. If it's a callback `(x: any) =>`, type it with the actual signature.

- [ ] **Step 3:** Build:

```bash
cd /opt/general-expenses-tracker/frontend && npx ng build --configuration=production 2>&1 | tail -5
```

### Task 8.2: Verify NG8102 fixed in history (already done in Phase 6)

### Task 8.3: Commit

```bash
git add frontend/src/app/features/loans/
git commit -m "fix(loans): replace any with concrete type"
```

---

## Phase 9 — Functional QA end-to-end

### Task 9.1: Deploy current frontend

- [ ] **Step 1:** Ensure the latest build is in `frontend/dist/general-expenses-frontend/browser/` (nginx serves from there):

```bash
cd /opt/general-expenses-tracker/frontend && npx ng build --configuration=production 2>&1 | tail -10
ls -la dist/general-expenses-frontend/browser/index.html
```

- [ ] **Step 2:** Optional: reload nginx if cache is suspect:

```bash
sudo nginx -s reload
```

### Task 9.2: Functional QA — capture screenshots per route

For each route, capture desktop + mobile screenshots and verify visually.

- [ ] **Step 1:** Login page (already covered by Phase 2 screenshots).

- [ ] **Step 2:** Authenticated routes — open in headed Chrome handoff OR script via puppeteer-style automation. If no automation available, do MANUAL QA by opening the site in a real browser, walking each page, and noting issues.

  Routes to test:
  - `/dashboard` — KPIs render, net-position strip visible, no emoji, mono numerics
  - `/expenses` — list renders, filters work, create modal opens, edit, delete, approve (admin), reject (admin)
  - `/loans` — list renders, create modal, add repayment, settle
  - `/history` — timeline groups by date, filter works, detail panel opens
  - `/admin` (admin only) — user table renders, create user works, edit, delete

- [ ] **Step 3:** Record bugs in `/tmp/qa-findings.txt`. For each bug, decide:
  - **Fix in this PR** — visual regression from the refactor, or backend bug that QA surfaced
  - **Defer** — pre-existing issue unrelated to the refresh

### Task 9.3: Fix any blocker bugs found

- [ ] **Step 1:** For each blocker, write a small commit fixing it. Pattern:

```bash
git add <files>
git commit -m "fix(<scope>): <one-line>"
```

- [ ] **Step 2:** Re-deploy + re-QA the affected route.

### Task 9.4: Final visual sweep + screenshots

- [ ] **Step 1:** Capture login (desktop + mobile), dashboard (desktop + mobile), expenses (desktop), loans (desktop), history (desktop), admin (desktop).

- [ ] **Step 2:** Save to `/tmp/qa-final/*.png`. Read each in the Read tool to visually verify.

---

## Phase 10 — Push to main

### Task 10.1: Verify clean working tree

- [ ] **Step 1:**
```bash
cd /opt/general-expenses-tracker
git status
git log --oneline origin/main..HEAD
```

Expected: working tree clean, 8-12 new commits ahead of `origin/main` (token sweep, login fix, inline-hex, dashboard, expenses split, history split, admin split, TS cleanup, plus any QA fixes).

### Task 10.2: Push

- [ ] **Step 1:** **STOP — ASK USER** before pushing. Pushing to main is a shared-state operation.

```bash
echo "About to push the following commits to origin/main:"
git log --oneline origin/main..HEAD
```

- [ ] **Step 2:** With user approval:
```bash
git push origin main
```

- [ ] **Step 3:** Verify:
```bash
git status
```

Expected: `Your branch is up to date with 'origin/main'.`

### Task 10.3: Post-deploy sanity

- [ ] **Step 1:** Hit the live URL and verify it loads:

```bash
curl -sS -m 5 -o /dev/null -w "HTTP %{http_code}\n" https://thai.expenses.syaefulaz.my.id/
```

Expected: `HTTP 200`.

- [ ] **Step 2:** Login + dashboard load from a real browser (the user does this).

---

## Self-review (run after writing)

**1. Spec coverage:**
- Modern fintech minimal — Phase 1 (tokens) + Phase 4 (dashboard) + emoji removal across all phases ✓
- Indigo + light only — Phase 1 token table ✓
- JetBrains Mono for numerics — Phase 1.2 + Phase 4.3 ✓
- Mobile login fix — Phase 2 ✓
- Emoji removal — Phase 2 (login) + Phase 4 (dashboard) ✓
- Inline hex sweep — Phase 3 ✓
- Component splits — Phase 5/6/7 ✓
- TS cleanup — Phase 8 ✓
- Backend QA — Phase 0.2/0.3 + Phase 9.3 ✓
- Functional QA per route — Phase 9.2 ✓
- Push to main — Phase 10 ✓

**2. Placeholder scan:**
- "MOVE TABLE/ROW MARKUP HERE" — this is a real instruction (move existing markup, not "implement later"), and the destination is named. Acceptable.
- "COPY filter-bar styles here" — same; the source is named. Acceptable.
- No "TBD" / "TODO" / "implement later" found.

**3. Type consistency:**
- `ExpenseFilters` interface defined in Phase 5.1, used in 5.4 — same name throughout ✓
- `Expense`, `User`, `ExpenseStatus` from `@core/models` — used consistently ✓
- `fmtThb / fmtUsd / fmtIdr / fmtDate` from `@core/utils/currency.utils` — consistent ✓
- `CATEGORY_STYLE` in Phase 3.2 is the only color-tone source — used in templates via `[class]="'tone-' + cat.tone"` ✓

No issues to fix.

---

## Risks during execution

- **Token sweep misses a use site → invisible / wrong color.** Mitigation: build runs after each phase; visual QA in Phase 9.
- **Component split breaks two-way binding (`[(open)]`).** Mitigation: every child uses explicit `@Input()` + `@Output()` change emitter pair, not magic `model()`.
- **Backend QA surfaces a deep bug.** Mitigation: file-and-fix or file-and-defer at the user's discretion; do not let it block the UI shipment.
- **JetBrains Mono fetch fails on first load.** Mitigation: fallback to `ui-monospace`. Already in the stack.

---

## Execution

After approval, hand to `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans`.
